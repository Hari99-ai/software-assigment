const {test}=require('node:test');const assert=require('node:assert/strict');
const {sendExternalNotifications}=require('../lib/notificationAdapters');
test('external notification adapters use configured recipient and private server credentials',async()=>{
 const calls=[];const request=async(url,options)=>{calls.push({url,options,body:JSON.parse(options.body)});return {ok:true,status:200};};
 const result=await sendExternalNotifications({email:'demo@example.test',phone:'9876543210',title:'Order confirmed',body:'Demo order',name:'Demo'},{emailService:'service',emailTemplate:'template',emailPublicKey:'public',emailPrivateKey:'private',smsDevice:'device',smsApiKey:'secret'},request);
 assert.deepEqual(result,{email:'sent',sms:'sent'});assert.equal(calls[0].body.template_params.to_email,'demo@example.test');assert.deepEqual(calls[1].body.recipients,['+919876543210']);
});
test('unconfigured adapters do not make network calls; failures are recorded without throwing',async()=>{
 const noRequest=()=>{throw new Error('unexpected call');};assert.deepEqual(await sendExternalNotifications({title:'Demo',body:'Message'},{},noRequest),{});
 const response=await sendExternalNotifications({phone:'9876543210',title:'Demo',body:'Message'},{smsDevice:'device',smsApiKey:'secret'},async()=>({ok:false,status:429}));assert.equal(response.sms,'failed:429');
});
