# SmallBiHackSydney

Last Updated 20th May 2018.

## Pete and Elle

A POC application to connect many API's, including; Pay Pal, Google Assistant, Quick Books.. and more (not in the app yet).
Working as a Middleware API, Pete and Elle will orchestrate the power of these API's and bring together something new.

## DEV SETUP

1. Download from Repo.
2. NPM install / or Yarn
3. Adding your own API credentials
   - create a file named: 'credentials-config.js'
   - Add the following code below to the file.
   - Paste in your Id's and Secrets (this will change as the application grows)

~~~~
module.exports = {
  paypal: {
    'mode': 'sandbox',
    'client_id': 'CLIENT ID HERE',
    'client_secret': 'CLIENT SECRET HEREs'
  },
  quickbooks: {},
  aws: {},
  google: {}
}
~~~~

## TESTS

tbc
