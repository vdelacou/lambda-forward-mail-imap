
`npx npm-check-updates -u`
# lambda-forward-mail-imap

I used a french email-service for more 15 years (laposte.net), but as their webmail is shit, I use their pop server to retrieve my email inside gmail.

Since 14 april 2022, this service doesn't allow to use pop or imap outside of french territory. So gmail cannot pop my email anymore.

So I decide to create a small lambda to do this:
* I connect by imap to the mailbox
* I search for unread message
* I copy the message and send this copy with AWS SES
* I make the email as read

I run this script every 5 min, inside an AWS Lambda.

## How to setup

First you need to configure AWS SES with an identity (the adress you will send email with).

Do it in the `us-east-1` region.

It takes less than 20 sec by following [theses steps](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html#just-verify-email-proc)

Then copy the `.env.example` to `.env.production`

Add you imap credentials and put to FORWARD_TO the email you setup in SES

```
IMAP_USER=
IMAP_PASSWORD=
IMAP_HOST=
IMAP_PORT=

FORWARD_TO=
```


## How to deploy

Of course you need and AWS account.

You can also follow the instructions to setup your AWS account with serverless [here](https://www.serverless.com/framework/docs/getting-started)

`npm install`

`npm run deploy`

See the logs : `npm run tail-log`

## How to clean

`npm run remove`

## How to try locally

Of course for `laposte.net` it works only if you are in france (or use a VPN)

You can also follow the instructions to setup your AWS [here](https://www.serverless.com/framework/docs/getting-started)

`npm run dev`

`curl --request POST 'http://localhost:3002/2015-03-31/functions/lambda-forward-mail-imap-offline-forward_email/invocations' `

## LICENCE

Do what you want, I am ok with it.