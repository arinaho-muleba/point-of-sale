terraform {
  backend "s3" {
    bucket = "point-of-sale-levelup-bucket"
    key = "point-of-sale/terraform.tfstate"  # Specify the path/key for your state file
    region = "us-east-1"
  }
}