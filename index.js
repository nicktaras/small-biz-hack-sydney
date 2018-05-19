var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var https = require('https');
var axios = require('axios');
var paypal = require('paypal-rest-sdk');
var port = process.env.PORT || 4000;
var credentials = require('./credentials-config');

// Auth PAY PAL.
paypal.configure(credentials.paypal);

// PAY PAL

// TODO:
// GOOGLE: How to Trigger Google to Speak
// PAYPAL: How to Trigger Payment with Payments
// PAYPAL: How to Check balance

// Define Public Folder for serving Front End.
app.use(express.static('public'))

// Front End Index.
// We could place event html here.
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

// Learning Reference.
// https://github.com/paypal/PayPal-node-SDK
// https://www.youtube.com/watch?v=7k03jobKGXM
app.post('/pay', (req, res) => {

  var create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:4000/success",
        "cancel_url": "http://localhost:4000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Ticket to the Moon",
                "sku": "001",
                "price": "25.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "25.00"
        },
        "description": "Ticket to the Moon"
    }]
};
  // credentials.paypal

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        console.log("Create Payment Response");
        console.log(payment);
        res.send('test');
    }
  });

});

// API:

// POST: Make Payments - Invoke Pay Pal to run Payments.
// POST: Recieved Payment Callback End Point / Triggers Google Home to Say:

// When The Events company makes a payment
// Recieve how much
// Return Success / Response.
// TODO: Make Payment Quick Books.

// Example of Async request.
// app.get('/test', async (req, res, next) => {
//     try {
//         await axios.get('https://www.goget.com.au/')
//           .then(response => {
//             res.setHeader('Content-Type', 'application/json');
//             res.send(JSON.stringify({ data: 'invoice created' }, null, 3));
//           })
//     } catch (e) {
//         // fire down to error middleware
//         return next(e)
//     }
// })

// We'll need to invoke the API to make a payment from quick books.
app.post('/quickbooks-test-customer-make-payment', function (req, res){
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: 'success' }, null, 3));
});

// Quick Books will need to fire this call Callback
// Which we can send to Google Actions to invoke speech.
app.post('/quickbooks-cb-payment-recieved', function (req, res){

    var data = {
      "Payment": {
        "CustomerRef": {
          "value": "20",
          "name": "Red Rock Diner"
        },
        "DepositToAccountRef": {
          "value": "4"
        },
        "TotalAmt": 65.0,
        "UnappliedAmt": 10.0,
        "ProcessPayment": false,
        "domain": "QBO",
        "sparse": false,
        "Id": "163",
        "SyncToken": "0",
        "MetaData": {
          "CreateTime": "2015-01-16T15:08:12-08:00",
          "LastUpdatedTime": "2015-01-16T15:08:12-08:00"
        },
        "TxnDate": "2015-01-16",
        "Line": [
          {
            "Amount": 55.0,
            "LinkedTxn": [
              {
                "TxnId": "70",
                "TxnType": "Invoice"
              }
            ],
            "LineEx": {
              "any": [
                {
                  "name": "{http://schema.intuit.com/finance/v3}NameValue",
                  "declaredType": "com.intuit.schema.finance.v3.NameValue",
                  "scope": "javax.xml.bind.JAXBElement$GlobalScope",
                  "value": {
                    "Name": "txnId",
                    "Value": "70"
                  },
                  "nil": false,
                  "globalScope": true,
                  "typeSubstituted": false
                },
                {
                  "name": "{http://schema.intuit.com/finance/v3}NameValue",
                  "declaredType": "com.intuit.schema.finance.v3.NameValue",
                  "scope": "javax.xml.bind.JAXBElement$GlobalScope",
                  "value": {
                    "Name": "txnOpenBalance",
                    "Value": "71.00"
                  },
                  "nil": false,
                  "globalScope": true,
                  "typeSubstituted": false
                },
                {
                  "name": "{http://schema.intuit.com/finance/v3}NameValue",
                  "declaredType": "com.intuit.schema.finance.v3.NameValue",
                  "scope": "javax.xml.bind.JAXBElement$GlobalScope",
                  "value": {
                    "Name": "txnReferenceNumber",
                    "Value": "1024"
                  },
                  "nil": false,
                  "globalScope": true,
                  "typeSubstituted": false
                }
              ]
            }
          }
        ]
      },
      "time": "2015-07-28T15:16:15.435-07:00"
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ data: data.payment.TotalAmt }, null, 3));

});

// This will be fired when Quick Books calls back this Event
// when money is withdrawn from the account.
// Google will be invoked - to update us with the new account balance.
app.post('/quickbooks-cb-ammount-withdrawn', function(req, res){
  var out = "X AUD has now been withdrawn from your account."
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: out }, null, 3));
});

// Quick Books will invoke our API when payments are due
// This will in turn invoke Goolge Assistant to ast for an answer from
// our event manager.
app.post('/quickbooks-cb-payment-due', function(req, res){
  // Respond with Options HATEOUS.
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: "Shall we pay all outstanding invoices from our vendors from event X" }, null, 3));
});

// Google will get the balance from Quick Books
// Where this response will invoke Google to speak the balance given.
// This end point will be used: 'when asked for balance'
app.get('/google-get-balance', function(req, res){
  var mock = {
    "Account": {
      "Name": "Pete and Elle Accounts Receivable",
      "SubAccount": false,
      "FullyQualifiedName": "Pete and Elle Accounts Receivable",
      "Active": true,
      "Classification": "Asset",
      "AccountType": "Accounts Receivable",
      "AccountSubType": "AccountsReceivable",
      "CurrentBalance": 0,
      "CurrentBalanceWithSubAccounts": 0,
      "CurrencyRef": {
        "value": "AUD",
        "name": "Australian Dollar"
      },
      "domain": "QBO",
      "sparse": false,
      "Id": "108",
      "SyncToken": "0",
      "MetaData": {
        "CreateTime": "2018-05-19T01:43:22-07:00",
        "LastUpdatedTime": "2018-05-19T01:43:22-07:00"
      }
    },
    "time": "2018-05-19T02:20:39.614-07:00"
  }
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: mock.Account.CurrentBalance }, null, 3));
});

// Application Event handling goes here.
io.on('connection', function(socket){
  // On new something dispatch something to subscribers.
  // socket.on('something', function(something){
  //   io.emit('something', something);
  // });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
