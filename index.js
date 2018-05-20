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

// TODO AUTH QUICK BOOKS:

app.get('/getaccountbalance', async (req, res) => {

  console.log('get account balance requested from Quick Books');

  var _params = {
      "company": 193514699950549,
      "account": 13
  };

  var _headers = {
    "Content-Type": "application/json",
    "refresh_token": "Q011535503314YJnHl7btJ5lNhj50B9s6yNKF1MH06UQUub3ys",
    "access_token": "eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..Vfwx4xoprLDYozFp1_50xA.uoYx2_M0g3GZhn3kzmnGBx8bONJT-8M8s0YLSCn5orKA7ZdsKFMHTadaIPyOJIiq6OfFnmKF-TyY59-b3OvgNN623GjwlRVSRNLG8kRhLRcZVN3r14YCqve1NwMTewxlkLKXjyGanZB2piY2CDPao2CD0KA-NkOxTZ2PXqDbECmrsXezba4tEh1dtkUaCyIaR5Cpsf3mbdIzYu1zJWk1rGJtZnv_J4MVex2D_0uneqVZV8euNdBbw2XLqHpX_-BilpzIJrRpgnV8sHOoKFVSAZzVM8XKyp4DXzD9Mwa9T9R0XkW8kw2qub8cVTYCX1uuyZZbjDpGZserUQoXE2escCUDxUfNbVahtdtbRPQ6spUlTcMGQaBqLNq7u4TOtJpi_L_EL45XMH7doKBY-APzoStdZ8OvyXcl48CNB9Qv2t7s91rZriALLNmoTshZpw6LVbdG1nr7TJ62kDRb6cpsvpbttBCHFFXPND37EHqkFkFxNkvarTRPeuk4P14VTlVQyRFl52oD1r2FctTKrBiICI3AHwjyohkuznIAqOURsG6fYWx9IQc7vrPdyHvhafNLV-gDJ8tLDtdV5p5uhSn_JqgFkx0PbD_zvSW07gfWc2T6OkZMQMp2CiTMEfY7lr6qcn6Dc5eOw_G-dDvZ2Yw93ONS4hh9Z97JMo4_K3DyVF6nWG04etJTP-H8dgboscmniiKnzJbSiugpiL6Q25Qg76hSGD_TsNtFApppfZidMIg.7mMBGJZfDnfmntZ9MUuHwg",
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

      })
      } catch (e) {
        return next(e)
      };

});

// app.get('/test', async (req, res, next) => {
    // try {
    //     await axios.get('https://www.goget.com.au/')
    //       .then(response => {
    //         res.setHeader('Content-Type', 'application/json');
    //         res.send(JSON.stringify({ data: 'invoice created' }, null, 3));
    //       })
    // } catch (e) {
    //     // fire down to error middleware
    //     return next(e)
    // }
// })

//
//
// PAY PAL
//
//

// PAYMENTS CLIENT TO EVENT MANAGER.

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

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {

        // For testing. Redirect to Success.
        // console.log("Create Payment Response");
        // console.log(payment);
        // res.send('test');

        for (let i = 0; i < payment.links.length; i++) {

          if(payment.links[i].rel === 'approval_url'){

            res.redirect(payment.links[i].href);

          }

        }

    }
  });

});

// CANCEL PAYMENT PAYPAL
app.get('/cancel', (req, res) => res.send('Cancelled'));

// PAYMENT SUCCESS PAYPAL
app.get('/success', (req, res) => {

  console.log("req Nick Test", req);

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

// CREATE INVOICE PAYPAL.
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
        console.log("Create Invoice Response");
        console.log(invoice);
        res.send("Success Invoice Created");
    }
});

});

// SEND BULK PAYOUT

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
// app.get('/google-get-balance', function(req, res){
//   var mock = {
//     "Account": {
//       "Name": "Pete and Elle Accounts Receivable",
//       "SubAccount": false,
//       "FullyQualifiedName": "Pete and Elle Accounts Receivable",
//       "Active": true,
//       "Classification": "Asset",
//       "AccountType": "Accounts Receivable",
//       "AccountSubType": "AccountsReceivable",
//       "CurrentBalance": 0,
//       "CurrentBalanceWithSubAccounts": 0,
//       "CurrencyRef": {
//         "value": "AUD",
//         "name": "Australian Dollar"
//       },
//       "domain": "QBO",
//       "sparse": false,
//       "Id": "108",
//       "SyncToken": "0",
//       "MetaData": {
//         "CreateTime": "2018-05-19T01:43:22-07:00",
//         "LastUpdatedTime": "2018-05-19T01:43:22-07:00"
//       }
//     },
//     "time": "2018-05-19T02:20:39.614-07:00"
//   }
//   res.setHeader('Content-Type', 'application/json');
//   res.send(JSON.stringify({ data: mock.Account.CurrentBalance }, null, 3));
// });

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
