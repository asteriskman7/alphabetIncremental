"use strict";

/*
  disable button when already at maxVal
*/

class App {
  constructor() {
    this.canvas = document.getElementById('cmain');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.onmousemove = (e) => this.onmousemove(e);
    this.canvas.onclick = (e) => this.onclick(e);
    document.getElementById('breset').onclick = () => document.getElementById('dreset').style.display = 'block';
    document.getElementById('bresetyes').onclick = () => this.reset();
    document.getElementById('bresetno').onclick = () => document.getElementById('dreset').style.display = 'none';
    this.dstatus = document.getElementById('dstatus');
    document.getElementById('bhelp').onclick = () => document.getElementById('dhelp').style.display = 'block';
    document.getElementById('bhelpclose').onclick = () => document.getElementById('dhelp').style.display = 'none';

    this.logo = document.getElementById('logo');
    this.icons = [];
    for (let i = 0; i < 26; i++) {
      this.icons[i] = document.getElementById(`icon${i}`);
    }
    this.itemNames = 'Apple,Banana,Cactus,Dog,Elephant,Fish,Glasses,Hat,Ice Cream,Jingle,Koala,Ladybug,Mushroom,Notebook,Octopus,Pencil,Quickness,Ring,Shoe,Tiger,Umbrella,Vehicle,Watermellon,Xray,Yam,Zap'.split`,`;

    this.pickup = document.getElementById('pickup');

    this.objects = [];
    
    this.loadState();
    this.lastPrestige = this.state.prestigelvl;
    this.initGame();

    this.mouse = {x: -Infinity, y: -Infinity};

    

    this.globalUpgrades = [
      //{display: "Basket size", levelVar: "bsizelvl", stateVar: "bsize", upgradeType: '*', upgradeVal: 1.1, maxVal: 100, costType: '*', costVal: 2, cost0: 10},
      {display: "Auto generation", levelVar: "autogenlvl", stateVar: "autogen", upgradeType: '*', upgradeVal: 2, maxVal: 1e300, costType: '*', costVal: 2.1, cost0: 100},
      {display: "Prestige", currency: "prestigePoints", levelVar: "prestigelvl", stateVar: "prestigeCount", upgradeType: '+', upgradeVal: 1, maxVal: 26, costType: '*', costVal: 1, cost0: 10}
    ];

    this.localUpgrades = [
      {display: "Collector speed", levelVar: "hoverspeedlvl", stateVar: "hoverspeed", upgradeType: '+', upgradeVal: 1, maxVal: 10, costType: '*', costVal: 2, cost0: 100},
      {display: "Collector size", levelVar: "hoversizelvl", stateVar: "hoversize", upgradeType: '+', upgradeVal: 5, maxVal: 5, costType: '*', costVal: 2, cost0: 100}
    ];
    
    this.localUpgradeButtons = [];
    this.initUpgradesUI('globalUpgrades', this.globalUpgrades, this.state, 'Global Upgrades', 'globalUpgradeButtons', this.logo);
    
    this.t = 0;
    this.useOfflineTime = true;
    setInterval(() => this.tick(), 1000 / 30);
    setInterval(() => this.saveState(), 2000);
  }

  formatNumber(f) {
    if (f >= 1000) {
      return f.toExponential(3);
    } else {
      return Math.floor(f).toFixed(0);
    }
  }

  initUpgradesUI(containerID, upgradesList, state, label, barrayName, img) {
    const container = document.getElementById(containerID);
    container.innerHTML = '';

    this[barrayName] = [];

    const elabel = document.createElement('h2');
    const labelImg = document.createElement('img');
    if (img !== undefined) {
      labelImg.src = img.src;
      labelImg.classList.add('upgradeIcon');
    }
    const labelText = document.createElement('span');
    labelText.innerText = label;
    elabel.appendChild(labelImg);
    elabel.appendChild(labelText);
    container.appendChild(elabel);

    const table = document.createElement('table');
    const hr = document.createElement('tr');
    ['Upgrade', 'Value', 'Next', 'Cost', ''].forEach( l => {
      const th = document.createElement('th');
      th.innerText = l;
      hr.appendChild(th);
    });
    table.appendChild(hr);

    upgradesList.forEach( u => {
      //display currentVal nextVal cost buy
      const tr = document.createElement('tr');
      const tdd = document.createElement('td');
      tdd.innerText = u.display;
      tr.appendChild(tdd);

      const tdc = document.createElement('td');
      tdc.innerText = this.formatNumber(state[u.stateVar]);
      tr.appendChild(tdc);

      const tdn = document.createElement('td');
      tdn.innerText = this.formatNumber(this.getNextUpgradeVal(u, state));
      tr.appendChild(tdn);

      const tdcost = document.createElement('td');
      const costValue = this.getNextUpgradeCost(u, state);
      tdcost.innerText = (u.currency === 'prestigePoints' ? 'P' : '$') + this.formatNumber(costValue);
      tr.appendChild(tdcost);

      const tdb = document.createElement('td');
      const buttonBuy = document.createElement('button');
      this[barrayName].push(buttonBuy);
      buttonBuy.cost = costValue;
      buttonBuy.currency = u.currency ?? 'score';

      buttonBuy.innerText = 'Buy';
      buttonBuy.onclick = () => {
        this.buyUpgrade(u, state);
        this.initUpgradesUI(containerID, upgradesList, state, label, barrayName, img);
      };
      tdb.appendChild(buttonBuy);
      tr.appendChild(tdb);

      table.appendChild(tr);
    });

    container.appendChild(table);
  }

  buyUpgrade(upgrade, state) {
    const upgradeCost = this.getNextUpgradeCost(upgrade, state);
    const upgradeCurrency = upgrade.currency ?? 'score';
    if (this.state[upgradeCurrency] >= upgradeCost) {
      this.state[upgradeCurrency] -= upgradeCost;
      state[upgrade.stateVar] = this.getNextUpgradeVal(upgrade, state);
      state[upgrade.levelVar]++;
    }
  }

  getNextUpgradeVal(upgrade, state) {
    const curVal = state[upgrade.stateVar];
    switch (upgrade.upgradeType) {
      case '*': {
        return curVal * upgrade.upgradeVal;
      }
      case '+': {
        return curVal + upgrade.upgradeVal;
      }
    }
  }

  getNextUpgradeCost(upgrade, state) {
    const lvl = state[upgrade.levelVar];
    const mult = state.costMult ?? 1;
    switch (upgrade.costType) {
      case '*': {
        return Math.floor(mult * (upgrade.cost0 * Math.pow(upgrade.costVal, state[upgrade.levelVar])));
      }
      case '+': {
        return Math.floor(mult * (upgrade.cost0 + upgrade.costVal * (state[upgrade.levelVar])));
      }
    }
  }

  reset() {
    localStorage.removeItem('alphabetIncremental');
    window.location.reload();
  }

  loadState() {
    const rawState = localStorage.getItem('alphabetIncremental');

    this.state = {
      prestigelvl: 0,
      prestigeCount: 0,
      score: 0,
      prestigePoints: 0,
      bsize: 20,
      bsizelvl: 0,
      autogen: 1,
      autogenlvl: 0,
      doubleTime: 0,
      lastTime: (new Date()).getTime(),
      startTime: (new Date()).getTime(),
      endTime: undefined,
      spawners: [
        {costMult: 1, hoverspeedlvl: 0, hoverspeed: 1, hoversizelvl: 0, hoversize: 5, inCount: 0, coinCount: 0},
        {costMult: 5, hoverspeedlvl: 0, hoverspeed: 1, hoversizelvl: 0, hoversize: 5, inCount: 0, coinCount: 0}
      ]
    };

    if (rawState !== null) {
      const loadedState = JSON.parse(rawState);
      this.state = {...this.state, ...loadedState};
    }

    this.saveState();
  }

  saveState() {
    const saveString = JSON.stringify(this.state);
    localStorage.setItem('alphabetIncremental', saveString);
  }

  import(s) {
    localStorage.setItem('alphabetIncremental', s);
    window.location.reload();
  }

  export() {
    console.log(localStorage.getItem('alphabetIncremental'));
  }

  initGame() {
    document.getElementById('localUpgrades').innerHTML = '';
    //create spawners
    this.spawners = [];
    this.objects = [];
    const genCount = Math.min(26, this.state.prestigeCount + 2);
    //const genCount = 6;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const genPosRadius = 300;
    for (let i = 0; i < genCount; i++) {
      const angle = Math.PI + Math.PI * 2 * i / genCount;

      const spawner = {
        type: 'spawner',
        id: i,
        nextId: (i + 1) % genCount,
        label: String.fromCharCode(65 + i),
        x: genPosRadius * Math.cos(angle),
        y: genPosRadius * Math.sin(angle),
        z: 0,
        spawnRadius: 50,
        spawnCount: 10,
        alive: true,
        collectorAngle: 0,
        collectorRadius: 40,
        nextSpawn: 0,
        coinList: []
      };
      
      this.objects.push(spawner);
      this.spawners.push(spawner);
      const rawCoinCount = this.state.spawners[i].coinCount;
      let coinCount;
      let coinValue;
      let singlesCount;
      if (rawCoinCount > 200) {
        coinCount = Math.floor(rawCoinCount / 200);
        coinValue = Math.floor(rawCoinCount / coinCount);
        singlesCount = rawCoinCount - (coinCount * coinValue);
        for (let j = 0; j < coinCount; j++) {
          this.spawnCoin(spawner, coinValue, true);
        }
      } else {
        singlesCount = rawCoinCount;
      }
      for (let j = 0; j < singlesCount; j++) {
        this.spawnCoin(spawner, 1, true);
      }
    }
  }

  nextLevel() {
    this.state.prestigePoints = 0;
    this.state.spawners = [];
    const genCount = this.state.prestigeCount + 2;
    for (let i = 0; i < genCount; i++) {
      const costMult = Math.pow(5, i);
      this.state.spawners.push({costMult, hoverspeedlvl: 0, hoverspeed: 1, hoversizelvl: 0, hoversize: 5, inCount: 0, coinCount: 0});
    } 
    this.initGame();
  }
  
  rndRange(min, max) {
    return min + (max - min) * Math.random();
  }
  
  tick() {
    const curTime = new Date();
    let deltaTime;
    deltaTime = (curTime - this.state.lastTime) / 1000;

    if (deltaTime > 1) {
      this.state.doubleTime += deltaTime - 1/30;
    }

    this.t += 1/30;
    this.update();
    if (this.state.doubleTime > 0 && this.useOfflineTime) {
      while (true) {
        this.t += 1/30;
        this.update();
        this.state.doubleTime = Math.max(0, this.state.doubleTime - 1/30);
        deltaTime = ((new Date()) - curTime) / 1000;
        if (deltaTime > 1/30 || this.state.doubleTime <= 0) {
          break;
        }
      }
    }
    this.draw();

    this.state.lastTime = curTime.getTime();
  }

  spawnCoins(spawner, value, init) {
    if (value <= 0) {return;}
    const rawCoinCount = value;
    let coinCount;
    let coinValue;
    let singlesCount;
    if (rawCoinCount > 100) {
      coinValue = Math.floor(rawCoinCount / 100);
      coinCount = 100;
      singlesCount = rawCoinCount - (coinCount * coinValue);
      for (let j = 0; j < coinCount; j++) {
        this.spawnCoin(spawner, coinValue, init);
      }
    } else {
      singlesCount = rawCoinCount;
    }
    //at some point, floating point rounder error can cause singlesCount to become large
    // however, at that magnitude, a few more coins don't matter 
    if (value < 10000) {
      for (let j = 0; j < singlesCount; j++) {
        this.spawnCoin(spawner, 1, init);
      }
    }
  }

  spawnCoin(spawner, value, init) {
    if (!init) {
      this.state.spawners[spawner.id].coinCount += value;
    }

    if (spawner.coinList.length < 50) {
      const objectArray = init ? this.objects : this.aliveObjects;
      const spawnAngle = Math.random() * 2 * Math.PI;
      const spawnRadius = Math.random() * spawner.spawnRadius + 25;
      const spawnX = spawnRadius * Math.cos(spawnAngle);
      const spawnY = spawnRadius * Math.sin(spawnAngle);
      const newCoin = {
        type: 'coin',
        x: spawner.x + spawnX,
        y: spawner.y + spawnY,
        z: 100,
        srcId: spawner.id,
        nextId: spawner.nextId,
        value: value,
        alive: true
      };
      objectArray.push(newCoin);
      spawner.coinList.push(newCoin);
    } else {
      //pick a random alive coin and increase its value
      while (true) {
        const coinIndex = Math.floor(Math.random() * spawner.coinList.length);
        if (spawner.coinList[coinIndex].alive === false) {
          continue;
        }

        spawner.coinList[coinIndex].value += value;
        break;
      }
    }
  }
  
  update() {

    if (this.state.prestigelvl > this.lastPrestige) {
      this.lastPrestige = this.state.prestigelvl;
      this.nextLevel();
      return;
    }

    this.gameOver = this.state.prestigelvl === 25;
    if (this.gameOver) {
      if (this.state.endTime === undefined) {
        this.state.endTime = (new Date()).getTime();
      }
      return;
    }

    this.aliveObjects = [];
    this.objects.forEach( o => {
      switch (o.type) {
        case 'spawner': {
          const mdx = o.x - this.mouse.x;
          const mdy = o.y - this.mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          const coinsToSpawn = Math.floor(this.state.spawners[o.id].inCount / o.spawnCount);
          const inRemaining = this.state.spawners[o.id].inCount % o.spawnCount;
          
          this.spawnCoins(o, coinsToSpawn);
          this.state.spawners[o.id].inCount = inRemaining;

          if (o.id === 0) {
            const spawnPerSecond = this.state.autogen;
            const secondsPerSpawn = 1 / spawnPerSecond;
            let spawnPerPeriod = 0;
            if (secondsPerSpawn > 1/30) {
              if (this.t > o.nextSpawn) {
                o.nextSpawn = o.nextSpawn + secondsPerSpawn;
                this.spawnCoin(o, 1);
              }
              spawnPerPeriod = 1;
            } else {
              spawnPerPeriod = Math.floor(spawnPerSecond / 30);
              //this.spawnCoin(o, spawnPerPeriod);
              this.spawnCoins(o, spawnPerPeriod);
            }
            if (mdist < 5) {
              //this.spawnCoin(o, spawnPerPeriod * 0.25);
              this.spawnCoins(o, Math.max(Math.floor(spawnPerPeriod * 0.25), 1))
            }
          }

          //hover speed of 1 should require 1 minute to revolve
          o.collectorAngle += this.state.spawners[o.id].hoverspeed * 4 * Math.PI / (60 * 1000 / 30);
          const minRadius = 20 + this.state.spawners[o.id].hoversize;
          const maxRadius = 75 - this.state.spawners[o.id].hoversize;
          o.collectorRadius = (maxRadius + minRadius) / 2 + (maxRadius - minRadius) * 0.5 * Math.sin(this.t);
          o.collectorX = o.x + o.collectorRadius * Math.cos(o.collectorAngle);
          o.collectorY = o.y + o.collectorRadius * Math.sin(o.collectorAngle);
          o.collectorSize = this.state.spawners[o.id].hoversize;

          o.coinList = o.coinList.filter( c => c.alive );

          break;
        }
        case 'coin': {
          const mdx = o.x - this.mouse.x;
          const mdy = o.y - this.mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          const collectRadius = this.state.bsize + 5;
          const coinSpawner = this.spawners[o.srcId];
          const cdx = o.x - coinSpawner.collectorX;
          const cdy = o.y - coinSpawner.collectorY;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          const collectRadiusC = coinSpawner.collectorSize + 5;

          if (mdist < collectRadius || cdist < collectRadiusC) {
            o.targetx = this.spawners[o.nextId].x;
            o.targety = this.spawners[o.nextId].y;
          }
        
          if (o.targetx !== undefined) {
            const dx = -(o.x - o.targetx);
            const dy = -(o.y - o.targety);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const targetAngle = Math.atan2(dy, dx);
            const stepSize = Math.min(30, dist);
            const newx = o.x + stepSize * Math.cos(targetAngle);
            const newy = o.y + stepSize * Math.sin(targetAngle);
            
            const cdx = o.x - o.targetx;
            const cdy = o.y - o.targety;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            if (cdist < 5) {
              o.alive = false;
              if (o.nextId !== 0) {
                this.state.spawners[o.nextId].inCount += o.value;
              } else {
                this.state.prestigePoints += o.value;
              }
              this.state.score += Math.floor(o.value * Math.pow(5, o.srcId));
              this.state.spawners[o.srcId].coinCount -= o.value;
            }
            
            o.x = newx;
            o.y = newy;                    
          }
        }
      }
      if (o.alive) {
        this.aliveObjects.push(o);
      }
    });   
  
    this.objects = this.aliveObjects;
    this.objects.sort( (a,b) => a.z - b.z );
  }
  
  draw() {

    this.globalUpgradeButtons.forEach( b => {
      b.disabled = this.state[b.currency] < b.cost;
    });

    this.localUpgradeButtons.forEach( b => {
      b.disabled = this.state[b.currency] < b.cost;
    });

    this.ctx.save();
    
    const ctx = this.ctx;
    const img = document.getElementById('img1');
    
    ctx.fillStyle = 'hsl(59, 32%, 60%)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

    ctx.font = '20px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    this.objects.forEach( o => {
      switch (o.type) {
        case 'spawner': {
          //background
          ctx.fillStyle = 'hsl(5, 72%, 60%)';
          ctx.beginPath();
          ctx.arc(o.x, o.y, 20, 0, 2 * Math.PI);
          ctx.fill();

          //fill
          ctx.fillStyle = 'hsl(116, 72%, 60%)';
          ctx.beginPath();
          const inCount = this.state.spawners[o.id].inCount;
          ctx.moveTo(o.x, o.y);
          ctx.arc(o.x, o.y, 20, 0, 2 * Math.PI * inCount / o.spawnCount);
          ctx.fill();


          //label
          ctx.fillStyle = 'white';
          ctx.fillText(o.label, o.x, o.y);

          const spawnerState = this.state.spawners[o.id];
          const size = spawnerState.hoversize;

          const cx = o.collectorX;
          const cy = o.collectorY;
          ctx.fillStyle = 'orange';
          ctx.beginPath();
          ctx.arc(cx, cy, size, 0, Math.PI * 2);
          ctx.fill();

          break;
        }
        case 'coin': {
          ctx.drawImage(this.icons[o.srcId], o.x - 8, o.y - 8, 16, 16);
          break;
        }
      }
    });
        
    ctx.drawImage(this.pickup, this.mouse.x - this.state.bsize, this.mouse.y - this.state.bsize, this.state.bsize * 2, this.state.bsize * 2);
    
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'black';
    ctx.font = '50px monospace';
    ctx.fillText('$' + this.formatNumber(this.state.score), 390, -370);
    ctx.fillText('P' + this.formatNumber(this.state.prestigePoints), 390, -330);
    if (this.state.doubleTime > 0) {
      ctx.fillStyle = 'green';
      ctx.fillText(this.formatNumber(this.state.doubleTime), 390, -290);
    }

    if (this.gameOver) {
      for (let i = 0; i < 26; i++) {
        const x = i % 7 + 0.5 * Math.cos(this.t + i * 999 * Math.cos(i * 999));
        const j = Math.floor(i / 7) + 0.5 * Math.sin(this.t + i * 999 * Math.sin(i * 999));
        ctx.drawImage(this.icons[i], -250 + x * 70, -300 + j * 70, 64, 64);
      }
      ctx.font = '50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('You Win!', 0, 100);
      ctx.font = '20px Arial';
      const gameLength = this.state.endTime - this.state.startTime;
      const gameTime = this.timeToObj(gameLength / 1000);
      const gameTimeStr = this.timeObjToLongStr(gameTime);
      ctx.fillText(gameTimeStr, 0, 175);
      ctx.font = '50px Arial';
      ctx.fillText('Now you know your ABCs!', 0, 360);
    }
    
    this.ctx.restore();

    let statusString = this.spawners.map( s => {
      const inCount = this.state.spawners[s.id].inCount;
      const txt = s.label + ((inCount > 9) ? '*' : inCount);
      return txt;
    }).join`:`;

    let playTime;
    if (this.gameOver) {
      playTime = this.state.endTime - this.state.startTime;
    } else {
      playTime = (new Date()) - this.state.startTime;
    }
 
    const playTimeStr = this.timeObjToLongStr(this.timeToObj(playTime / 1000));
    this.dstatus.innerText = statusString + ' ' + playTimeStr;
  }
  
  onmousemove(e) {
    if (e.buttons === 1) {return;}
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left - this.canvas.width / 2;
    this.mouse.y = e.clientY - rect.top - this.canvas.height / 2; 
  }

  onclick(e) {
    let found = false;
    this.spawners.forEach( s => {
      const dx = this.mouse.x - s.x;
      const dy = this.mouse.y - s.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 400) {
        found = true;
        this.initUpgradesUI('localUpgrades', this.localUpgrades, this.state.spawners[s.id], `${this.itemNames[s.id]} Upgrades`, 'localUpgradeButtons', this.icons[s.id]);
      }
    });
    if (!found) {
      document.getElementById('localUpgrades').innerHTML = '';
    }
  }

  timeToObj(t) {
    const result = {};

    result.y = Math.floor(t / (365 * 24 * 60 * 60));
    t = t % (365 * 24 * 60 * 60);
    result.d = Math.floor(t / (24 * 60 * 60));
    t = t % (24 * 60 * 60);
    result.h = Math.floor(t / (60 * 60));
    t = t % (60 * 60);
    result.m = Math.floor(t / 60);
    t = t % 60;
    result.s = t;

    return result;
  }

  leftPad(value, padChar, minLen) {
    return padChar.repeat(Math.max(0, minLen - value.toString().length)) + value;
  }

  timeObjToLongStr(o) {
    return `${o.y} years ${this.leftPad(o.d, '0', 3)} days ${this.leftPad(o.h, '0', 2)} hours ${this.leftPad(o.m, '0', 2)} minutes ${this.leftPad(Math.floor(o.s), '0', 2)} seconds`;
  }
}

const app = new App();
