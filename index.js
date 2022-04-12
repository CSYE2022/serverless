const AWS = require('aws-sdk')

let ses = new AWS.SES();
let dynamo = new AWS.DynamoDB({
    apiVersion: '2012-08-10'
});

exports.emailService = async (event) => {

    console.log(event);
    const sns = event.Records[0].Sns;
    console.log(sns);

    const message = JSON.parse(sns.Message);

    const to = message.username;
    const token = message.token;

    console.log("to", to);
    console.log("token", token);

    const dynamoDBInputParams = {
        KeyConditionExpression: "userId = :v1",
        ExpressionAttributeValues: {
            ":v1": {
                S: to
            }
        },
        TableName: process.env.DYNAMODB_TABLE_NAME
    }
    // checking if mail has already been sent
    try {
        let data = await dynamo.query(dynamoDBInputParams).promise();
        if(data.Count > 0){
            console.log("user already exists", data);
            return;
        }

    } catch (err) {
        console.log("there was an err",err);
    }

    // dynamo.query(dynamoDBInputParams, function (err, data) {
    //     if (err) console.log(err, err.stack);
    //     else {
    //         console.log("mail has already been sent to this user");
    //         return;
    //     }
    // })

    //if mail hasn't been sent
    //put item in dynamodb
    const dynamoDBPutInputParams = {
        Item: {
            userId: {
                S: to
            }
        },
        TableName: process.env.DYNAMODB_TABLE_NAME
    }
    try {
        let data = await dynamo.putItem(dynamoDBPutInputParams).promise();
    } catch (err) {
        console.log(err);
    }

    //sending email to the user
    console.log("sourceArn", `arn:aws:ses:${process.env.REGION}:${process.env.ACCOUNT_ID}:identity/${process.env.ENV_TYPE}.jasonpauldj.me`);
    console.log("source", `notification@${process.env.ENV_TYPE}.jasonpauldj.me`);


    const inputParams = {
        SourceArn: `arn:aws:ses:${process.env.REGION}:${process.env.ACCOUNT_ID}:identity/${process.env.ENV_TYPE}.jasonpauldj.me`,
        Source: `notification@${process.env.ENV_TYPE}.jasonpauldj.me`,
        Destination: {
            ToAddresses: [to]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: `<div><p>Hello ${to},</p>
                    <p>Thank you for signing up to our services. We are happy to welcome you in the family.</p>
                    <p>You are almost ready to enjoy the full experience. Simply click the below link to verify your e-mail address.</p>
                    <p><a  href=\"http://${process.env.ENV_TYPE}.jasonpauldj.me/v1/verifyUserEmail?email=${to}&token=${token}\" target=\"_blank\">Click here to verify email</a></p>
                    </div>`
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Service Verification Mail"
            }
        }
    }

    // let promise=ses.sendEmail(inputParams).promise();
    // promise.then((data)=>{
    //     console.log(data);
    // }).catch(err=>{
    //     console.log(err);
    // })
    // console.log("promise", promise);

    return ses.sendEmail(inputParams).promise();

    // ses.sendEmail(inputParams, function(err, data) {
    //     if (err) console.log(err, err.stack); // an error occurred
    //     else console.log(data); // successful response
    // });


    // const response = {
    //     statusCode: 200,
    //     body: JSON.stringify('Hello from Lambda!'),
    // };
    // return response;
};



//event object
// Records: [
//     {
//       EventSource: 'aws:sns',
//       EventVersion: '1.0',
//       EventSubscriptionArn: 'arn:aws:sns:us-east-1:502560949037:TestTopic:349cda3a-d959-4f2a-986c-23363615e435',
//       Sns: [Object]
//     }
//   ]

//sns Object
// Type: 'Notification',
//   MessageId: '2cc31e30-80e7-5e3b-9c25-44fe52950456',
//   TopicArn: 'arn:aws:sns:us-east-1:502560949037:TestTopic',
//   Subject: null,
//   Message: '{"username":"jane9.doe@example.com","token":"123456789"}',
//   Message: "{'username':'jasonpauldj@gmail.com','token':'123456789'}",
//   Timestamp: '2022-04-12T01:04:50.815Z',
//   SignatureVersion: '1',
//   Signature: 'GeVo2Qolz2k+yJtDL3fy8DDt5rLUQig9eyYYPmTBG5dpvCAfdwQbnSntMW3v+avCYhU2OivtP2L51F4NKRCGyKR7trzHcifUTI4nwgwKlNHX6zn8Bh+K3IsjyAQP1VZqUKc0XT8ftH0TxQu7NBx64XxQV7Y1me1SWqBRgnZhmpeK5hJWFh01wI756FR72ukFKWH5++dxMGiUybxiQhc9eOe2/FpArR+MSzXvYMWk0O/mnOZOVLgi2jPvAdmjyVS1CU4WnH5sah8SwjOwodJxTjXU071SgGttE8yNuqaDtQZUVfXA9kEWXyBU0G09yJt/wmAjp+XUU2AbgajFVjXMxw==',
//   SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-7ff5318490ec183fbaddaa2a969abfda.pem',
//   UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:502560949037:TestTopic:349cda3a-d959-4f2a-986c-23363615e435',
//   MessageAttributes: {}

// Type: 'Notification',
//   MessageId: 'd93a8c13-d30f-57a1-90b4-d6dc3524dccf',
//   TopicArn: 'arn:aws:sns:us-east-1:605025718575:EmailTopic',
//   Subject: null,
//   Message: "{'username':'jasonpauldj@gmail.com','token':'123456789'}",
//   Timestamp: '2022-04-12T20:41:15.027Z',
//   SignatureVersion: '1',
//   Signature: 'VPoDVBMP6/ZEHLopHhtOFr/H10Fna8G0DHXRVOl98sC10N8+JBKX7riMw5LU8/LfbCIHaccSxPXJqoJUuTm6OP/AkISj2evN5OauIR7P8K9b0I1Stlf8QoIWgVjT1phexe1HTZkZNkou1mxbk47qmk6h2NyYugczVqBolHe+9tFXm183RiXvxZ1EVUTJ4ONlqfhx/iJP3F9+F9ZtJ/lIRX8yprmYnJ0G9fptqTZOHizBRugXfBEZIxkFCj/O9ywbDk2jp48RjO1jXCM+yi7L3ZdfVzzrfgOacf/858HT1q/Z+dhuZxSLGa+WAzFKfOeG9jOpVIcvIX6BvJFpy81D9Q==',
//   SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-7ff5318490ec183fbaddaa2a969abfda.pem',
//   UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:605025718575:EmailTopic:0ebaa18b-0d24-4c5b-b328-21d76c2a4889',
//   MessageAttributes: {}