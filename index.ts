import { createClient } from 'npm:@supabase/supabase-js@2.57.2';
import { AccessToken } from 'npm:livekit-server-sdk@2.15.0';

const headers = {'Content-Type':'application/json','Access-Control-Allow-Origin':'https://euripedesboni.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Método inválido'},405);
 try {
  const auth=req.headers.get('Authorization')||'';
  if(!auth.startsWith('Bearer '))return reply({error:'Entre no aplicativo'},401);
  const base=Deno.env.get('SUPABASE_URL')!;
  const pub=Deno.env.get('SUPABASE_ANON_KEY')!;
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const key=Deno.env.get('LIVEKIT_API_KEY');
  const secret=Deno.env.get('LIVEKIT_API_SECRET');
  const ws=Deno.env.get('LIVEKIT_URL');
  if(!key||!secret||!ws||!/^wss:\/\//.test(ws))return reply({error:'LiveKit ainda não configurado no servidor'},503);
  const client=createClient(base,pub,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:{user},error:userError}=await client.auth.getUser();
  if(userError||!user)return reply({error:'Sessão inválida'},401);
  const {session_id}=await req.json();
  if(typeof session_id!=='string'||!/^[a-f0-9-]{36}$/i.test(session_id))return reply({error:'Aula inválida'},400);
  const admin=createClient(base,service,{auth:{persistSession:false}});
  const {data:session,error:sessionError}=await admin.from('live_sessions').select('id,classroom_id,status').eq('id',session_id).maybeSingle();
  if(sessionError||!session||session.status!=='live')return reply({error:'Aula não está ao vivo'},403);
  const [{data:role,error:roleError},{data:member,error:memberError}] = await Promise.all([
   client.rpc('current_staff_role'),
   admin.from('classroom_memberships').select('id').eq('classroom_id',session.classroom_id).eq('user_id',user.id).eq('status','active').limit(1)
  ]);
  if(roleError||memberError)return reply({error:'Falha ao verificar permissões'},500);
  const staff=['admin','teacher'].includes(role);
  if(!staff&&!member?.length)return reply({error:'Matrícula ativa necessária'},403);
  let approved=staff;
  if(!staff){const {data,error}=await admin.from('live_speaking_requests').select('status').eq('session_id',session.id).eq('user_id',user.id).maybeSingle();if(error)return reply({error:'Falha na autorização'},500);approved=data?.status==='approved';}
  const token=new AccessToken(key,secret,{identity:user.id,ttl:'10m'});
  token.addGrant({roomJoin:true,room:'bv-'+session.id,canSubscribe:true,canPublish:approved,canPublishData:true,canPublishSources:approved?(staff?['camera','microphone','screen_share','screen_share_audio']:['camera','microphone']):[]});
  return reply({url:ws,token:await token.toJwt(),is_teacher:staff,can_publish:approved,session_id:session.id});
 }catch(e){console.error('boniverso-live-token',e);return reply({error:'Não foi possível abrir a sala'},500)}
});
