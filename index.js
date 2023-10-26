import {mlog,say} from './logs.js'
process.on('uncaughtException', (err) => {
    mlog('Глобальный косяк приложения!!! ', err.stack);
    }); 
let test = true
let platurl = "api-dev" 
platurl = "api" 

import {inf,tinfo} from './info.js'

import OBSWebSocket, {EventSubscription} from 'obs-websocket-js';
import express from 'express'
import * as path from 'path'
import easyvk from 'easyvk'
import * as fs from 'fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import request from 'request';
import { networkInterfaces } from 'os';

import urlencode from 'urlencode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
var PORT = process.env.PORT || 777;
const app = express();

const obs = new OBSWebSocket();
let conn = await obs.connect('ws://localhost:4455', inf('obspass'));

var vk

var fullstat = []
async function update_stat(){
    fullstat = [await obs.call('GetRecordStatus'), await obs.call('GetStreamStatus')]
    return fullstat
}
let access = ''
let gr = ''
let mat = ''
let less = 0
let course = 0
let streamid = 0
app.get('/',async (req,res)=>{
    let ans = {ans:'ok'}
    let record_tmr = 0
    switch (req.query.cmd) {
        case 'startrec':
            mlog("startrec")
            mlog(req.query)
            access = req.query.access
            gr = req.query.gr
            mat = req.query.mat
            course = req.query.course
            less = req.query.less
            if ((await obs.call('GetRecordStatus')).outputActive){
                ans = "nok"
            } else{
                await obs.call('StartRecord');
                ans = "ok"
                setTimeout(async ()=>{
                    mlog(await obs.call('GetRecordStatus'));
                    ans = await obs.call('GetRecordStatus');
                },1000)
                record_tmr = setTimeout(()=>{
                    record_tmr = 0
                    stop_record()
                },45*60*1000)
            }                  
            break;
        case 'stoprec':
            mlog("stoprec")
            if ((await obs.call('GetRecordStatus')).outputActive){
                await stop_record()
                if (record_tmr!=0){
                    record_tmr = 0
                    clearTimeout(record_tmr)
                }
                ans = 'ok'
            } else
            ans = 'nok'
        break;
        case 'recstat':
            mlog("recstat")
            ans = await obs.call('GetRecordStatus');
        break;
        case 'streamstat':
            mlog("streamstat")
            ans = await obs.call('GetStreamStatus');
        break;
        case 'fullstat':
            ans = await update_stat()
            mlog(ans)
        break;
        case 'streamstart':
            mlog("streamstart")
            access = req.query.access
            streamid = req.query.streamid
            ans = await obs.call('GetStreamStatus');
            if (!ans.outputActive){
                 await obs.call('StartStream');
                 ans = 'ok'
            } else ans = 'nok'
        break;
        case 'streamstop':
            mlog("streamstop")
            await stop_stream();
            ans = await obs.call('GetStreamStatus');
            if (ans.outputActive){
                await obs.call('StopStream');
                ans = 'ok'
            } else ans = 'nok'
        break;
    }
    console.log(ans);
    res.json(ans)
}) 
app.get('/dev',async (req,res)=>{
    console.log(req.query.url);
    platurl = req.query.url
    res.send(platurl)
})  

app.get('/ok',async (req,res)=>{
    //console.log('ok');
    res.send("ok")
})  

async function stop_record() {
    let t = await obs.call('StopRecord');
    mlog(t.outputPath)
    setTimeout(async ()=>{await vk_upload(path.basename(t.outputPath))},1500)
    setTimeout(async ()=>{await platon_upload(path.basename(t.outputPath))},3000)
    return t.outputPath
}
async function stop_stream() {
    console.log(streamid);
    console.log(access);
    let body = {end_date:getdate()}
    request({
        url: `https://${platurl}.platonics.ru/teacher/streams/`+streamid,
        headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${access}`
          },
        method: "POST",
        json: true,  
        body: body
    },function (error, response, body) {
       // console.log(response.toJSON());
        console.log(response.statusCode);
        mlog(body);
    })
}

//vk_upload("2023-10-25_17-03-43.mp4") 
async function vk_upload(video_path) {
    vk.uploader.getUploadURL('video.save', {
        group_id: inf('group_id')
      }).then(async (url) => {
        const formData = {
            video_file: fs.createReadStream(`./video/${video_path}`),
            timeout: 60000 * 5
        };
        
        request.post({url:url, formData},async function optionalCallback(err, httpResponse, body) {
            if (err) {
                setTimeout(async ()=>{await vk_upload(video_path)},4000)
                console.log(httpResponse);
                console.log(body);
              return mlog('upload failed:', err);
            } else {
                body = JSON.parse(body)
                let vurl = ""
                setTimeout(async ()=>{vurl = await getvideourl (inf('group_id'),body.video_id)},5000)
               
            }
            mlog(body);
           
          });
      }); 
}
async function platon_upload(video_path){
    const formData = {
        video_file: fs.createReadStream(`./video/${video_path}`),
    };
    
    request.post({url:"https://platon.teyhd.ru/upload", formData}, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return mlog('upload failed:', err);
        }
        mlog(body);
        /*request({
            url: `https://platon.teyhd.ru/addmat?url=${video_path}&token=1&vkhash=null`,
            method: "GET",
           // json: true,  
        }, function (error, response, body){
            //console.log(response);
           // res.send(body)
            console.log(body);
        });
       */
    });
    
}
//getvideourl('222361696_456239096')
//platon_upload("2023-09-26_10-57.mp4")
async function getvideourl (own,id) {
    let vid = await vk.call('video.get',{
        videos: "-" +own + "_" + id
    })
   // console.dir(vid);
    console.dir(vid.items[0].player);
    if (vid.items[0].player==undefined) {
        setTimeout(getvideourl,1000,own,id)
    } else {
        request({
            url: `https://platon.teyhd.ru/addmat?url=${urlencode(vid.items[0].player)}&access=${access}&course=${course}&less=${less}`,
            method: "GET",
           // json: true,  
        }, function (error, response, body){
            //console.log(response);
           // res.send(body)
            mlog(body);
        });
        return vid.items[0].player
    }
}
async function vkstart() {
    let url = "https://platon.teyhd.ru"
    if (test) {
        url = "http://localhost:707"
    }
    request({
        url: `${url}/info?token=hulgbsGrtfs4ETEwgs34`,
        headers: {'Content-Type': 'application/json'},
        method: "GET",
        json: true,  
    }, async function (error, response, body){
        if (body==undefined){
            console.log('Ошибка получения логина');
            setTimeout(vkstart,2500)
        } else {
            tinfo.login=body.login
            tinfo.pass=body.pass
            tinfo.group_id=body.group_id
            vk = await easyvk({
                username: inf('login'),
                password: inf('pass'),
                sessionFile: path.join(__dirname, '.my-session'),
                utils: {uploader: true}
            })
            await sendstart()
        }
        
    })

}
async function start(){
    try {
        app.listen(PORT,()=> {
            mlog('Сервер - запущен')
            mlog('Порт:',PORT);
        })
       /*/ let vkr = await vk.call('messages.send', {
            peer_id: vk.session.user_id,
            message: `Клиент ${inf('kab')} - онлайн.`,
            random_id: easyvk.randomId()
        });*/
        await vkstart()
    } catch (e) {
        mlog(e);
    }
}
async function sendstart() {
    let url = "https://platon.teyhd.ru"
    if (test) {
        url = "http://localhost:707"
    }
    request({
        //url: "platon.teyhd.ru:707",
        //url: "https://platon.teyhd.ru:707",
        url: url+`/kabstart?kab=${inf('kab')}&online=1&host=${getmyip()}&stat=${JSON.stringify(await update_stat())}`,
        method: "GET",
        headers:{
            'content-type': 'multipart/form-data', 
        },
    }, function (error, response, bodys){
       //console.log(error);
        if (error!=null){
            mlog(`Главный сервер недоступен!`)
            setTimeout(sendstart,10000)
        }
        //console.log(response);
       mlog("Онлайн")
        //console.dir(bodys);
    })
}

function getmyip() {
const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            return net.address
            results[name].push(net.address);
        }
    }
}
mlog(JSON.stringify(results));
return JSON.stringify(results)
}
function getdate() {
    let d = new Date()
    //let ans = `${d.getFullYear()}-${curdate(d.getMonth()+ 1)}-${curdate(d.getDate())}`
    return d.toJSON()
}

function curdate(num) {
    return num<10 ? '0'+num : num
}
setInterval(sendstart,1000*60*10)
mlog(getmyip());
start();


/*
import { VK } from 'vk-io';

const vks = new VK({
    token: "vk1.a.q8bKD9bNgk40CuZQFgYlsnBRCGHw5npKXxNpa0Hi4zVt0jYRYmPz-i8sX3bh5O-9BuQ12jf0Xa1aKsa95LnNf0qR1r-FUykcWOu8lgIKAnTYJcORQeNpgVcbYuErP581PqbFBeEw3SzhOJKZM9aSyubntRy2a3ePSY00kpgkE5qiRDKCUFP3OZa71WmvRdw5TbDcIwvD1BmMbwYINf1Bxg"
});

//bigupload().catch(console.log);

async function bigupload() {
  let ans = await vks.upload.video({
        group_id: inf('group_id'),
        name: "name",
        source: {
            //timeout: 6000 * 5,
            value: './video/2023-09-26_10-57.mp4'
        }

    });
    console.log(ans);
}*/
/*
const attachment = await vks.upload.video({
    album_id: 0,
    group_id: inf('group_id'),
    name: "name",
    description: "desc",
    is_private: 0,
    wallpost: 1,
    no_comments: 0,
    repeat: 0,
    source: {
        value: './video/2023-10-25_13-01-49.mp4'
    }
});
console.log(attachment);
*/
/*
let body =6
request({
    url: `http://platon.teyhd.ru:707/addmat?url=${body}&token=1&vkhash=null`,
    method: "GET",
   // json: true,  
}, function (error, response, body){
    //console.log(response);
    console.log(body);
});
//const http = require('node:http');
/*
import http from 'http';
async function ts() {

    inftosend = JSON.stringify(inftosend)
    http.get(`http://localhost:707/kabstart?${inftosend}`, { agent }, (res) => {
        res.on('data', (data) => {
            console.log(data);
            // Ничего не делать
        });
    });  
}
console.log(await ts());
//
*/
function killstream () {
var mstreamid = 448397830121
var accessq = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzAzOTQyOTAxLCJpYXQiOjE2OTUzMDI5MDEsImp0aSI6IjU3YmE3OTlhZDYxNzQyOGY4ODlkMTFmZjRmNzAzMTE0IiwidXNlcl9pZCI6NH0.IWYCy0FGkhRoxMhDffLZZd7mu_qcdF9tEGZymc_Ha10`
let body = {end_date:getdate()}
request({
    url: `https://${platurl}.platonics.ru/teacher/streams/`+mstreamid,
    headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${accessq}`
      },
    method: "POST",
    json: true,  
    body: body
},function (error, response, body) {
   // console.log(response.toJSON());
    console.log(response.statusCode);
    mlog(body);
})
}
