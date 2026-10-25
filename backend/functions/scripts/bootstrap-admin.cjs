const admin=require('firebase-admin');
const uid=process.argv[2];
if(!uid)throw new Error('Usage: node scripts/bootstrap-admin.cjs <existing-firebase-auth-uid>');
admin.initializeApp();
(async()=>{const user=await admin.auth().getUser(uid);await admin.firestore().doc(`users/${uid}`).set({email:user.email,displayName:user.displayName||'Administrator',role:'admin',createdAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});console.log('Administrator provisioned for the specified UID.');await admin.app().delete();})().catch(e=>{console.error(e.message);process.exitCode=1;});
