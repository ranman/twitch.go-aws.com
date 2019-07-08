# Silly Twitch Kinesis Demo

This is a silly demo we created on twitch.tv/aws to show what you can do with [Amazon API Gateway](https://aws.amazon.com/api-gateway/) as a service proxy. No lambda functions were harmed, or even used, when making this demo.

![example application image](https://raw.githubusercontent.com/ranman/twitch.go-aws.com/master/imgs/example.png)

## Launch your own

1. Click this button: [![Launch Stack](https://cdn.rawgit.com/buildkite/cloudformation-launch-stack-button-svg/master/launch-stack.svg)](https://console.aws.amazon.com/cloudformation/home#/stacks/new?stackName=TwitchDemoAPIProxy&templateURL=https://aws-workshop-templates.s3.amazonaws.com/twitch/apigw-kinesis-demo/template.yaml)
1. Click through the wizard to deploy the stack.
1. Wait about 10 minutes.
1. Copy the outputs from CloudFormation into the `app.js` file. The naming should be obvious and the variables are at the top of the file. You want to make sure you've got the BaseURL, ClickStream, and HotSpotStream all setup.
1. Use the command listed in the CloudFormation output to build and upload the website.

Alternatively you can run this shindig locally with:

```bash
npm install
npm run start
```

## Details

What's actually happening here is that we are using API Gateway as a service proxy for [Amazon Kinesis Data Streams](https://aws.amazon.com/kinesis/data-streams/).

We host a little web page on S3 and serve it with CloudFront. The page has a canvas and when you click on it that generates a PUT record API call to our APIGW. APIGW then transforms the request and passes it on to Kinesis and it stores our event.

The PUT records side of this is actually a pretty common approach for folks to collect click stream data or scroll data for users of their websites. It makes it easy to run analytics later when you can throw a firehose on as the output and have that go direct to elasticsearch, splunk, or S3.

From there the records go into a [Kinesis Data Analytics](https://aws.amazon.com/kinesis/data-analytics/) application that runs a bit of machine learning and SQL to find hotspots in our click data. The hotspot output goes into another kinesis stream which we read on our webpage to paint cute little squares.

To paint these hotspots we have to:

1. Enumerate the shards by describing the stream (assuming <100 shards b/c if you have more than that you shouldn't use this).
1. Create a shard iterator for each of the shards in the stream, renew those iterators every 5 minutes or so.
1. Iterate over all of the shard iterators and grab all the records.
1. Send each of those records to a function that paints them on the canvas after doing a bit of sizing math.

The end result is absolutely ridiculous and this code, since it was coded on twitch, is provided at your own risk and peril with absolutely no guarantees. Good luck!

Thanks to Eric, [singledigit](https://github.com/singledigit) for having me on his stream to talk about this!
