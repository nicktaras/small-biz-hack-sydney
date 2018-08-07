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

// Auth API's Here:
paypal.configure(credentials.paypal); // PayPal Auth.

// TODO:
// GOOGLE: How to Trigger Google to Speak
// PAYPAL: How to Trigger Payment with Payments (DONE)
// QUICKBOOKS: How to Get account balance

// Define Public Folder for serving Front End (if required).
app.use(express.static('public'));

// Front End Index.
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

//
//
// QUICK BOOKS
//
//

app.get('/getaccountbalance', async (req, res) => {

  var _params = {
      "company": "", 
      "account": "" 
  };

  var _headers = {
    "Content-Type": "application/json",
    "refresh_token": "",
    "access_token": "",
    "expires_in": 3600,
    "x_refresh_token_expires_in": 8726400,
    "token_type": "bearer"
  };

  try {

    await axios.get('https://sandbox-quickbooks.api.intuit.com/v3/', {
      params: _params,
      headers: _headers })
      .then(response => {

        console.log('QUICK BOOKS CONNECTED: ', response);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ data: 'invoice created' }, null, 3));

      }, catch (e) {
        return next(e)
      });

});

//
//
// PAY PAL
//
//

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

  paypal.payment.create(create_payment_json, function (error, payment) {

    if (error) {
      
        throw error;
      
    } else {

        for (let i = 0; i < payment.links.length; i++) {

          if(payment.links[i].rel === 'approval_url'){

            res.redirect(payment.links[i].href);

          }

        }

    }
  });

});

app.get('/cancel', (req, res) => res.send('Cancelled'));

app.get('/success', (req, res) => {

  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id" : payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": "25.00"
      }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        res.send("Success");
    }
  });
  
});

app.get('/invoice', (req, res) => {

  var create_invoice_json = {
    "merchant_info": {
        "email": "nicktaras-facilitator@outlook.com",
        "first_name": "Nick",
        "last_name": "Taras",
        "business_name": "Pete and Elle",
        "phone": {
            "country_code": "001",
            "national_number": "5032141716"
        },
        "address": {
            "line1": "1234 Main St.",
            "city": "Portland",
            "state": "OR",
            "postal_code": "97217",
            "country_code": "US"
        }
    },
    "billing_info": [{
        "email": "nicktaras@hotmail.co.uk"
    }],
    "items": [{
        "name": "Sutures",
        "quantity": 100.0,
        "unit_price": {
            "currency": "USD",
            "value": 5
        }
    }],
    "note": "Rocket to the moon",
    "payment_term": {
        "term_type": "NET_45"
    },
    "shipping_info": {
        "first_name": "Sally",
        "last_name": "Patient",
        "business_name": "Not applicable",
        "phone": {
            "country_code": "001",
            "national_number": "5039871234"
        },
        "address": {
            "line1": "1234 Broad St.",
            "city": "Portland",
            "state": "OR",
            "postal_code": "97216",
            "country_code": "US"
        }
    },
    "tax_inclusive": false,
    "total_amount": {
        "currency": "USD",
        "value": "500.00"
    }
  };

  paypal.invoice.create(create_invoice_json, function (error, invoice) {
    if (error) {
        throw error;
    } else {
        res.send("Success Invoice Created");
    }
  });
});

app.get('/pay-event', (res, req) => {

var sender_batch_id = Math.random().toString(36).substring(9);

var create_payout_json = {
    "sender_batch_header": {
        "sender_batch_id": sender_batch_id,
        "email_subject": "You have a payment"
    },
    "items": [
        {
            "recipient_type": "EMAIL",
            "amount": {
                "value": 0.99,
                "currency": "USD"
            },
            "receiver": "nicktaras-buyer@outlook.com",
            "note": "Thank you.",
            "sender_item_id": "item_1"
        },
        {
            "recipient_type": "EMAIL",
            "amount": {
                "value": 0.90,
                "currency": "USD"
            },
            "receiver": "shirt-supplier-two@mail.com",
            "note": "Thank you.",
            "sender_item_id": "item_2"
        },
        {
            "recipient_type": "EMAIL",
            "amount": {
                "value": 2.00,
                "currency": "USD"
            },
            "receiver": "shirt-supplier-three@mail.com",
            "note": "Thank you.",
            "sender_item_id": "item_3"
        }
      ]
  };

  paypal.payout.create(create_payout_json, function (error, payout) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log("Create Payout Response");
          console.log(payout);
      }
  });

});


//
//
// GOOGLE
//
//

app.post('/quickbooks-test-customer-make-payment', function (req, res){
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: 'success' }, null, 3));
});

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

app.post('/quickbooks-cb-ammount-withdrawn', function(req, res){
  var out = "X AUD has now been withdrawn from your account."
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: out }, null, 3));
});

app.post('/quickbooks-cb-payment-due', function(req, res){
  // Respond with Options HATEOUS.
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: "Shall we pay all outstanding invoices from our vendors from event X" }, null, 3));
});

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
      "CurrentBalance": 100.00,
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
  var _fulfillmentText = 'Your cash balance for today is $' + mock.Account.CurrentBalance;
  res.send({ fulfillmentText: _fulfillmentText }, null, 3);
});

io.on('connection', function(socket){});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
