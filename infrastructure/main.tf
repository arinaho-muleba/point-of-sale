resource "aws_vpc" "point_of_sale_vpc" {
  cidr_block = var.VPC_CIDR
  enable_dns_support = true
  enable_dns_hostnames = true
}

#Internet gateway
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.point_of_sale_vpc.id
}

#Route table
resource "aws_route_table" "route_table" {
  vpc_id = aws_vpc.point_of_sale_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
}

# Create Subnets
resource "aws_subnet" "subnet1" {
  vpc_id     = aws_vpc.point_of_sale_vpc.id
  cidr_block = var.PUB_SUB1_CIDR
  availability_zone = var.ZONE1
}

resource "aws_subnet" "subnet2" {
  vpc_id     = aws_vpc.point_of_sale_vpc.id
  cidr_block = var.PUB_SUB2_CIDR
  availability_zone = var.ZONE2
}

#Route table association
resource "aws_route_table_association" "route_table_asso" {
  subnet_id      = aws_subnet.subnet1.id
  route_table_id = aws_route_table.route_table.id
}

resource "aws_route_table_association" "route_table_asso1" {
  subnet_id      = aws_subnet.subnet2.id
  route_table_id = aws_route_table.route_table.id
} 



# Elastic beanstalk security group
resource "aws_security_group" "point-of-sale-instance-sg" {
  name        = "webserver_sg"
  description = "Allow inbound SSH and HTTP traffic"
  vpc_id      = aws_vpc.point_of_sale_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 80
    to_port     = 8091
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "Web-traffic"
  }
}


resource "aws_elastic_beanstalk_application" "point-of-sale-beanstalk-backend-app" {
  name        = "point-of-sale-application-backend"
  description = "point of sale application backend"
}

resource "aws_elastic_beanstalk_environment" "point-of-sale-elastic-beanstalk-env" {
  name                = "point-of-sale-elastic-beanstalk-env"
  application         = aws_elastic_beanstalk_application.point-of-sale-beanstalk-backend-app.name
  solution_stack_name = "64bit Amazon Linux 2023 v6.1.7 running Node.js 20"
  cname_prefix        = "point-of-sale-app"

  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = aws_vpc.point_of_sale_vpc.id
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "AssociatePublicIpAddress"
    value     = true
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = "aws-elasticbeanstalk-ec2-role"
  }

 setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "LoadBalancerType"
    value     = "application"
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = "${aws_subnet.subnet1.id},${aws_subnet.subnet2.id}"
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "ELBSubnets"
    value     = "${aws_subnet.subnet1.id},${aws_subnet.subnet2.id}"
  }

  setting {
    namespace = "aws:elbv2:loadbalancer"
    name      = "SecurityGroups"
    value     = aws_security_group.point-of-sale-instance-sg.id
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SERVER_PORT"
    value     = "3000"
  }

  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "DeploymentPolicy"
    value     = "AllAtOnce"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "MatcherHTTPCode"
    value     = "200"
  }

  depends_on = [aws_security_group.point-of-sale-instance-sg]
}

resource "aws_instance" "Database" {
    ami = "ami-0427090fd1714168b"
    instance_type = "t2.micro"
    key_name = "levelup"
    subnet_id                   = aws_subnet.subnet1.id
    vpc_security_group_ids      = [aws_security_group.point-of-sale-instance-sg.id]
    associate_public_ip_address = true

    user_data = <<-EOF
        #!/bin/bash
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        curl -O https://packages.couchbase.com/releases/couchbase-release/couchbase-release-1.0-noarch.deb
        sudo dpkg -i ./couchbase-release-1.0-noarch.deb
        sudo apt-get update -y
        sudo apt-get install couchbase-server-community -y
        sudo apt-get install couchbase-server-community=7.6.2 -y
        EOF
    
    tags = {
        Name = "nosql embedded database"
    }

    
  depends_on = [aws_route_table_association.route_table_asso]
}
resource "aws_network_interface" "test" {
  subnet_id       = aws_subnet.subnet1.id
  private_ips     = ["10.0.1.1"]
  security_groups = [aws_security_group.point-of-sale-instance-sg.id]

  attachment {
    instance     = aws_instance.Database.id
    device_index = 1
  }
}
