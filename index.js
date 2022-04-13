const AWS = require('aws-sdk')

let ses = new AWS.SES();
let dynamo = new AWS.DynamoDB({
    apiVersion: '2012-08-10'
});

exports.emailVerification = async (event) => {

    console.log(event);
    const sns = event.Records[0].Sns;
    console.log(sns);

    const message = JSON.parse(sns.Message);

    const to = message.email;
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
        TableName: "emailTokenTbl"
    }

    try {
        let data = await dynamo.query(dynamoDBInputParams).promise();
        if(data.Count > 0){
            console.log("user already exists", data);
            return;
        }

    } catch (err) {
        console.log("there was an err",err);
    }

    const dynamoDBPutInputParams = {
        Item: {
            userId: {
                S: to
            }
        },
        TableName: "emailTokenTbl"
    }
    try {
        let data = await dynamo.putItem(dynamoDBPutInputParams).promise();
    } catch (err) {
        console.log(err);
    }


    console.log("sourceArn", `arn:aws:ses:us-east-1:556795868226:identity/prod.ebenezerwilliams.me`);
    console.log("source", `notification@${process.env.DomainName}`);


    const inputParams = {
        SourceArn: `arn:aws:ses:us-east-1:556795868226:identity/prod.ebenezerwilliams.me`,
        Source: `notification@${process.env.DomainName}`,
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
                    <p><a  href=\"http://${process.env.DomainName}.ebenezerwilliams.me/v1/verifyUserEmail?email=${to}&token=${token}\" target=\"_blank\">Click here to verify email</a></p>
                    <p>Or paste the following link in a browser: </p>
                    <p>http://${process.env.DomainName}/v1/verifyUserEmail?email=${to}&token=${token} </p>
                    </div>`
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: "One step left before you are done"
            }
        }
    }


    return ses.sendEmail(inputParams).promise();

};
