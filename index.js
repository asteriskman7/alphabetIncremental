"use strict";

/*
  decrease generator requirement for # of lower coins to gen new
  when there are too many coins, start increasing their value instead
    of making new
  make player image a basket or something similar
  get images for all 26 items
  have an winning screen or message
  get favicon
*/

class App {
  constructor() {
    this.canvas = document.getElementById('cmain');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.onmousemove = (e) => this.onmousemove(e);
    this.canvas.onclick = (e) => this.onclick(e);

    this.objects = [];
    
    this.loadState();
    this.lastPrestige = this.state.prestigelvl;
    this.initGame();

    
    this.mouse = {x: -Infinity, y: -Infinity};

    this.globalUpgrades = [
      {display: "Basket size", levelVar: "bsizelvl", stateVar: "bsize", upgradeType: '*', upgradeVal: 1.5, maxVal: 100, costType: '*', costVal: 2, cost0: 10},
      {display: "Auto generation", levelVar: "autogenlvl", stateVar: "autogen", upgradeType: '*', upgradeVal: 0.75, maxVal: 0, costType: '*', costVal: 2, cost0: 10},
      {display: "Prestige", currency: "prestigePoints", levelVar: "prestigelvl", stateVar: "prestigeCount", upgradeType: '+', upgradeVal: 1, maxVal: 26, costType: '*', costVal: 1, cost0: 10}
    ];

    this.localUpgrades = [
      {display: "Hover speed", levelVar: "hoverspeedlvl", stateVar: "hoverspeed", upgradeType: '+', upgradeVal: 1, maxVal: 10, costType: '*', costVal: 2, cost0: 10},
      {display: "Hover size", levelVar: "hoversizelvl", stateVar: "hoversize", upgradeType: '+', upgradeVal: 5, maxVal: 50, costType: '*', costVal: 2, cost0: 10}
    ];

    this.initUpgradesUI('globalUpgrades', this.globalUpgrades, this.state, 'Global Upgrades');
    this.initUpgradesUI('localUpgrades', this.localUpgrades, this.state.spawners[0], 'A Upgrades (click spawner to switch)');
    
    this.t = 0;
    setInterval(() => this.tick(), 1000 / 30);
    setInterval(() => this.saveState(), 2000);
  }

  initUpgradesUI(containerID, upgradesList, state, label) {
    const container = document.getElementById(containerID);
    container.innerHTML = '';

    const elabel = document.createElement('h2');
    elabel.innerText = label;
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
      tdc.innerText = state[u.stateVar];
      tr.appendChild(tdc);

      const tdn = document.createElement('td');
      tdn.innerText = this.getNextUpgradeVal(u, state);
      tr.appendChild(tdn);

      const tdcost = document.createElement('td');
      tdcost.innerText = (u.currency === 'prestigePoints' ? 'P' : '$') + this.getNextUpgradeCost(u, state);
      tr.appendChild(tdcost);

      const tdb = document.createElement('td');
      const buttonBuy = document.createElement('button');
      buttonBuy.innerText = 'Buy';
      buttonBuy.onclick = () => {
        this.buyUpgrade(u, state);
        this.initUpgradesUI(containerID, upgradesList, state, label);
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
    switch (upgrade.costType) {
      case '*': {
        return upgrade.cost0 * Math.pow(upgrade.costVal, state[upgrade.levelVar]);
      }
      case '+': {
        return upgrade.cost0 + upgrade.costVal * (state[upgrade.levelVar]);
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
      spawners: [
        {hoverspeedlvl: 0, hoverspeed: 1, hoversizelvl: 0, hoversize: 5, inCount: 0},
        {hoverspeedlvl: 0, hoverspeed: 1, hoversizelvl: 0, hoversize: 5, inCount: 0}
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

  initGame() {
    //create spawners
    this.spawners = [];
    this.objects = [];
    const genCount = this.state.prestigeCount + 2;
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
        nextSpawn: 0
      };
      
      this.objects.push(spawner);
      this.spawners.push(spawner);
    }
  }

  nextLevel() {
    this.initGame();
    this.state.prestigePoints = 0;
    this.state.spawners = [];
    const genCount = this.state.prestigeCount + 2;
    for (let i = 0; i < genCount; i++) {
      this.state.spawners.push({hoverspeedlvl: 0, hoverspeed: 1, hoversizelvl: 0, hoversize: 5});
    } 
  }
  
  rndRange(min, max) {
    return min + (max - min) * Math.random();
  }
  
  tick() {
    const curTime = new Date();
    let deltaTime;
    if (this.lastTime) {
      deltaTime = (curTime - this.lastTime) / 1000;
    } else {
      deltaTime = 1/30;
    }

    if (deltaTime > 1) {
      this.state.doubleTime += deltaTime - 1/30;
    }

    this.t += 1/30;
    this.update();
    if (this.state.doubleTime > 0) {
      this.t += 1/30;
      this.update();
      this.state.doubleTime = Math.max(0, this.state.doubleTime - 1/30);
    }
    this.draw();

    this.lastTime = curTime;
  }
  
  update() {

    if (this.state.prestigelvl > this.lastPrestige) {
      this.lastPrestige = this.state.prestigelvl;
      this.nextLevel();
      return;
    }

    this.gameOver = this.state.prestigelvl === 25;
    if (this.gameOver) {
      return;
    }

    const aliveObjects = [];
    this.objects.forEach( o => {
      switch (o.type) {
        case 'spawner': {
          const mdx = o.x - this.mouse.x;
          const mdy = o.y - this.mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          while (this.state.spawners[o.id].inCount >= o.spawnCount) {
            const spawnAngle = Math.random() * 2 * Math.PI;
            const spawnRadius = Math.random() * o.spawnRadius + 25;
            const spawnX = spawnRadius * Math.cos(spawnAngle);
            const spawnY = spawnRadius * Math.sin(spawnAngle);
            aliveObjects.push({
              type: 'coin',
              x: o.x + spawnX,
              y: o.y + spawnY,
              z: 100,
              srcId: o.id,
              nextId: o.nextId,
              value: 1,
              alive: true
            });
            this.state.spawners[o.id].inCount -= o.spawnCount;
          }

          if (o.id === 0 && (mdist < 5 || this.t > o.nextSpawn)) {
            const spawnAngle = Math.random() * 2 * Math.PI;
            const spawnRadius = Math.random() * o.spawnRadius + 25;
            const spawnX = spawnRadius * Math.cos(spawnAngle);
            const spawnY = spawnRadius * Math.sin(spawnAngle);
            o.nextSpawn = this.t + this.state.autogen;
            aliveObjects.push({
              type: 'coin',
              x: o.x + spawnX,
              y: o.y + spawnY,
              z: 100,
              srcId: o.id,
              nextId: o.nextId,
              value: 1,
              alive: true
            });
          }

          //hover speed of 1 should require 1 minute to revolve
          o.collectorAngle += this.state.spawners[o.id].hoverspeed * 2 * Math.PI / (60 * 1000 / 30);
          const minRadius = 20 + this.state.spawners[o.id].hoversize;
          const maxRadius = 75 - this.state.spawners[o.id].hoversize;
          o.collectorRadius = (maxRadius + minRadius) / 2 + (maxRadius - minRadius) * 0.5 * Math.sin(this.t);
          o.collectorX = o.x + o.collectorRadius * Math.cos(o.collectorAngle);
          o.collectorY = o.y + o.collectorRadius * Math.sin(o.collectorAngle);
          o.collectorSize = this.state.spawners[o.id].hoversize;

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
                this.state.spawners[o.nextId].inCount += 1;
              } else {
                this.state.prestigePoints++;
              }
              this.state.score += o.value;
            }
            
            o.x = newx;
            o.y = newy;                    
          }
        }
      }
      if (o.alive) {
        aliveObjects.push(o);
      }
    });   
  
    this.objects = aliveObjects;
    this.objects.sort( (a,b) => a.z - b.z );
  }
  
  draw() {
    this.ctx.save();
    
    const ctx = this.ctx;
    const img = document.getElementById('img1');

    if (this.gameOver) {
      return;
    }
    
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);


    ctx.font = '20px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    this.objects.forEach( o => {
      switch (o.type) {
        case 'spawner': {
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.arc(o.x, o.y, 20, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = 'green';
          ctx.beginPath();
          const inCount = this.state.spawners[o.id].inCount;
          ctx.arc(o.x, o.y, 20, 0, 2 * Math.PI * inCount / o.spawnCount);
          ctx.fill();
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
          ctx.drawImage(img, o.x - 8, o.y - 8, 16, 16);
          break;
        }
      }
    });
        
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(this.mouse.x, this.mouse.y, this.state.bsize, 0, 2 * Math.PI);
    ctx.fill();       
    
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'black';
    ctx.font = '50px monospace';
    ctx.fillText('$' + this.state.score, 390, -370);
    ctx.fillText('P' + this.state.prestigePoints, 390, -330);
    if (this.state.doubleTime > 0) {
      ctx.fillStyle = 'green';
      ctx.fillText(this.state.doubleTime.toFixed(1), 390, -290);
    }
    
    this.ctx.restore();
  }
  
  onmousemove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left - this.canvas.width / 2;
    this.mouse.y = e.clientY - rect.top - this.canvas.height / 2;    
  }

  onclick(e) {
    this.spawners.forEach( s => {
      const dx = this.mouse.x - s.x;
      const dy = this.mouse.y - s.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 400) {
        this.initUpgradesUI('localUpgrades', this.localUpgrades, this.state.spawners[s.id], `${s.label} Upgrades (click spawner to switch)`);
      }
    });
  }
}

const app = new App();
