const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');


const port = 3000;


async function autoScroll(page) {
  return page.evaluate(() => {
      return new Promise((resolve, reject) => {
          //滚动的总高度
          var totalHeight = 0;
          //每次向下滚动的高度 100 px
          var distance = 100;
          var timer = setInterval(() => {
              //页面的高度 包含滚动高度
              var scrollHeight = document.body.scrollHeight;
              //滚动条向下滚动 distance
              window.scrollBy(0, distance);
              totalHeight += distance;
              //当滚动的总高度 大于 页面高度 说明滚到底了。也就是说到滚动条滚到底时，以上还会继续累加，直到超过页面高度
              if (totalHeight >= scrollHeight) {
                  clearInterval(timer);
                  resolve();
              }
          }, 100);
      })
  });
}


async function takeScreenshot(config) {
 

  const browser = await puppeteer.launch(
    { 
      args: ["--no-sandbox",'--font-render-hinting=medium'],
      headless: false, // 启用非 Headless 模式
      devtools: true   // 启用 DevTools
    }
  );

  const page = await browser.newPage();
  
  // const pageInfo = page.viewport();
  
  // const contentWidth = await page.evaluate(() => document.body.scrollWidth);
  // const contentHeight = await page.evaluate(() => document.body.scrollHeight);
  let screenshotBuffer; 
  

  const defaultConfig = {
    width:1920,
    height:1080,
    tokenKey:'token'
  }

  const _config = Object.assign({},defaultConfig,config);

  const {token,width, height, url,dom } = _config;
  
   if (token) {
    await page.goto(url);
    await page.evaluate((data) => {
      const {token,tokenKey} = data
      sessionStorage.setItem(tokenKey, token);
    },_config);
  }
  
  await page.setViewport({ width, height });

  await page.goto(url);

  await autoScroll(page);

  if(!dom){
    screenshotBuffer = await page.screenshot({ encoding: 'binary',  fullPage: true});
  }else{
    const body = await page.$(dom);
    screenshotBuffer = await body.screenshot({
      encoding: 'binary', 
  });
  }
  await browser.close();
  return   screenshotBuffer;
} 

const app = express();

app.use(cors());

// fe header application/json
app.use(bodyParser.json())

app.post('/api/screenshot', async (req, res) => {
     const { url } = req.body
        if (!url) {
         return res.status(500).json({ error: 'url未定义' });
        }
        try {
        const screenshotBuffer = await takeScreenshot(req.body);
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

