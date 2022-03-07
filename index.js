"use strict";

/*
  hover over a generator to increase speed
  collecting coins sends them to the next generator
  increase auto generation speed
  increase hover generation speed
  add auto collector
  increase auto collector size
  increase auto collector speed
  increase player size
  decrease generator requirement for # of lower coins to gen new
  when there are too many coins, start increasing their value instead
    of making new
  ultimately, the generators make a loop
  prestige to increase the # of generators in the loop but start with
    lower coin requirement
  include 2x time accumulated while away
  make player image a basket or something similar
  when highest level coin comes back to the start, it produces prestige currency. 
    need certain amound of prestige currency to advance levels or multiply income points
*/

class App {
  constructor() {
    this.canvas = document.getElementById('cmain');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.onmousemove = (e) => this.onmousemove(e);

    this.objects = [];
    
    this.loadState();
    this.initGame();

    
    this.mouse = {x: -Infinity, y: -Infinity};

    this.globalUpgrades = [
      {display: "Basket size", levelVar: "bsizelvl", stateVar: "bsize", upgradeType: '*', upgradeVal: 1.5, maxVal: 100, costType: '*', costVal: 2, cost0: 10},
      {display: "Auto generation", levelVar: "autogenlvl", stateVar: "autogen", upgradeType: '*', upgradeVal: 0.95, maxVal: 0, costType: '*', costVal: 2, cost0: 10}
    ];

    this.localUpgrades = [
    ];

    this.initUpgradesUI('globalUpgrades', this.globalUpgrades, this.state);

    setInterval(() => this.tick(), 1000 / 30);
  }

  initUpgradesUI(containerID, upgradesList, state) {
    const container = document.getElementById(containerID);
    container.innerHTML = '';

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
      tdc.innerText = this.state[u.stateVar];
      tr.appendChild(tdc);

      const tdn = document.createElement('td');
      tdn.innerText = this.getNextUpgradeVal(u, state);
      tr.appendChild(tdn);

      const tdcost = document.createElement('td');
      tdcost.innerText = this.getNextUpgradeCost(u, state);
      tr.appendChild(tdcost);

      const tdb = document.createElement('td');
      const buttonBuy = document.createElement('button');
      buttonBuy.innerText = 'Buy';
      buttonBuy.onclick = () => {
        this.buyUpgrade(u, state);
        this.initUpgradesUI(containerID, upgradesList, state);
      };
      tdb.appendChild(buttonBuy);
      tr.appendChild(tdb);

      table.appendChild(tr);
    });

    container.appendChild(table);
  }

  buyUpgrade(upgrade, state) {
    const upgradeCost = this.getNextUpgradeCost(upgrade, state);
    if (this.state.score >= upgradeCost) {
      this.state.score -= upgradeCost;
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
      prestigeCount: 0,
      score: 0,
      bsize: 20,
      bsizelvl: 0,
      autogen: 0.95,
      autogenlvl: 0
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
    //const genCount = this.state.prestigeCount + 2;
    const genCount = 6;
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
        inCount: 0,
        alive: true
      };
      this.objects.push(spawner);
      this.spawners.push(spawner);
    }
  }
  
  rndRange(min, max) {
    return min + (max - min) * Math.random();
  }
  
  tick() {
    this.update();
    this.draw();
  }
  
  update() {
    const aliveObjects = [];
    this.objects.forEach( o => {
      switch (o.type) {
        case 'spawner': {
          const mdx = o.x - this.mouse.x;
          const mdy = o.y - this.mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          const rndLvl = 0.95 ;
          while (o.inCount > 10) {
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
            o.inCount -= 10;

          }

          if (o.id === 0 && (mdist < 5 || Math.random() > rndLvl)) {
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
          }
          break;
        }
        case 'coin': {
          const mdx = o.x - this.mouse.x;
          const mdy = o.y - this.mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          const collectRadius = this.state.bsize + 5;
          if (mdist < collectRadius) {
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
              this.spawners[o.nextId].inCount++;
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
    
    ctx.fillStyle = 'green';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

    ctx.font = '20px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    this.objects.forEach( o => {
      switch (o.type) {
        case 'spawner': {
          ctx.fillStyle = 'blue';
          ctx.beginPath();
          ctx.arc(o.x, o.y, 20, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.fillText(o.label, o.x, o.y);
          break;
        }
        case 'coin': {
          ctx.drawImage(img, o.x - 8, o.y - 8, 16, 16);
          break;
        }
      }
    });
        
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(this.mouse.x, this.mouse.y, this.state.bsize, 0, 2 * Math.PI);
    ctx.fill();       
    
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'black';
    ctx.font = '50px monospace';
    ctx.fillText(this.state.score, 400, -370);
    
    this.ctx.restore();
  }
  
  onmousemove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left - this.canvas.width / 2;
    this.mouse.y = e.clientY - rect.top - this.canvas.height / 2;    
  }
}

const app = new App();
