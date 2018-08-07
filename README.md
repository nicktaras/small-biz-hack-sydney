# SmallBizHackSydney

Last Updated 20th May 2018.

## Pete and Elle

A POC application to connect many API's, including; Pay Pal, Google Assistant, Quick Books.

## DEV SETUP

1. Download from Repo.
2. NPM install / or Yarn
3. Adding your own API credentials
   - create a file named: 'credentials-config.js'
   - Add the following code below to the file.
   - Paste in your Id's and Secrets (this will change as the application grows)
4. Once done, you can run the app with 'npm start'

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
