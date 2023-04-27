const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');


const port = 3000;

function isObject(obj){
  return typeof obj == 'object' && obj !=null
}

async function takeScreenshot(url, width=1920, height=1080,token) {

  const browser = await puppeteer.launch(
    { 
      args: ["--no-sandbox"],
      headless: false, // 启用非 Headless 模式
      devtools: true   // 启用 DevTools
    }
  );

  const page = await browser.newPage();

   if (token && isObject(token)) {
    const {k,v} = token;
    if(v) {
      await page.goto(url);
      await page.evaluate(() => {
        sessionStorage.setItem(k ||'token', v);
      });
    }
  }


  // if (token) {
  //   await page.goto(url);
  //   await page.type('#username', 'tiezhu_fenshen');
  //   await page.type('#password', 'your_password');
  //   await page.click('#login-button');
  //   await page.waitForNavigation();
  // }
 
  await page.setViewport({ width, height });

  await page.goto(url);

  const screenshotBuffer = await page.screenshot({ encoding: 'binary' });
  
  await browser.close();

  return screenshotBuffer;
}

const app = express();

app.use(cors());

app.use(bodyParser.json())

app.post('/api/screenshot', async (req, res) => {
     // const {width, height, url } = req.query;
     const { token,width, height, url } = req.body;
        if (!url) {
        return res.status(500).json({ error: 'url未定义' });
        }
        try {
        const screenshotBuffer = await takeScreenshot(url, width, height,token);
        return res.status(200).send(screenshotBuffer);
        } catch (error) {
      console.error(error);
      return res.status(500).json({ error: '截图失败' });
    }
 });

 app.post('/api/test',(req,res)=>{
    res.send({name:1})
 })


app.listen(port, () => {
  console.log('服务器正在运行中',`localhost:${port}`);
});