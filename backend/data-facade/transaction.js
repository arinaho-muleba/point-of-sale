const transaction = {
  transactionId: '',            
  timestamp: new Date(),       
  customerId: '',              
  items: [],                   
  totalAmount: 0,               
  paymentMethod: '',            
  transactionStatus: 'pending', 
  storeId: '',                  
  salespersonId: '',           
  additionalDetails: {}         
};

module.exports = { transaction };
