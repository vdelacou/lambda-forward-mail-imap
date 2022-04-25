import { Handler } from 'aws-lambda';
import { AWSError, config, SES } from 'aws-sdk';
import { SendEmailRequest } from 'aws-sdk/clients/ses';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

config.update({ region: 'us-east-1' });

const imapConfig: Imap.Config = {
  host: `${process.env.IMAP_HOST}`,
  password: `${process.env.IMAP_PASSWORD}`,
  port: Number(process.env.IMAP_PORT) || 993,
  tls: true,
  user: `${process.env.IMAP_USER}`
};

const getEmails = async (): Promise<void> => {
  const promise = new Promise<void>((resolve, reject) => {
    try {
      const imap = new Imap(imapConfig);
      imap.once('ready', () => {
        imap.openBox('INBOX', false, () => {
          imap.search(['UNSEEN'], (_errorSearch, results) => {
            const f = imap.fetch(results, { bodies: '' });
            f.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (_errorParser, parsed) => {
                  const {
                    from, subject, textAsHtml, text
                  } = parsed;
                  const params: SendEmailRequest = {
                    Destination: { ToAddresses: [`${process.env.FORWARD_TO}`] },
                    Message: {
                      Body: {
                        Html: {
                          Charset: 'UTF-8',
                          Data: textAsHtml || 'No data'
                        },
                        Text: {
                          Charset: 'UTF-8',
                          Data: text || 'No data'
                        }
                      },
                      Subject: {
                        Charset: 'UTF-8',
                        Data: subject || 'No data'
                      }
                    },
                    ReplyToAddresses: [from?.text || `${process.env.IMAP_USER}`],
                    Source: `${process.env.FORWARD_TO}`
                  };
                  const sendPromise = new SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();
                  await sendPromise.then(
                    (data) => {
                      resolve();
                      console.log(`email sent ${data.MessageId}`);
                    }
                  ).catch(
                    (sendEmailError: unknown) => {
                      console.error(sendEmailError, (sendEmailError as AWSError).stack);
                      reject();
                    }
                  );
                });
              });
              msg.once('attributes', (attrs) => {
                const { uid } = attrs;
                imap.addFlags(uid, ['\\Seen'], () => {
                  console.log('Marked as read!');
                });
              });
            });
            f.once('error', (ex) => reject(ex));
            f.once('end', () => {
              console.log('Done fetching all messages!');
              imap.end();
            });
          });
        });
      });

      imap.once('end', () => {
        console.log('Connection ended');
      });

      imap.connect();
    } catch (ex) {
      console.log('an error occurred');
      reject();
    }
  });
  await promise;
};

export const handler: Handler = async (): Promise<void> => {
  await getEmails();
};
