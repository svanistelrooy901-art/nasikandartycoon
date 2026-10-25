import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,SAUCES,assess} from '../public/engine.mjs';
import {tutorialTask} from '../public/tutorial.mjs';

test('Tutorial follows actual scoops and pours and only readies a perfect plate',()=>{
 for(let seed=1;seed<=80;seed++){
  const game=new Game();game.start(true,undefined,seed);
  for(const key of game.active.items){assert.equal(tutorialTask(game,SAUCES).kind,'food');assert.equal(tutorialTask(game,SAUCES).key,key);game.addFood(key);}
  assert.equal(tutorialTask(game,SAUCES).kind,'sauce');
  for(const key of game.active.sauces)game.pour(key,game.active.target/game.active.sauces.length);
  assert.equal(tutorialTask(game,SAUCES).kind,'serve');
  assert.equal(assess(game.active,game.items,game.gravy).accuracy,100);
 }
});
test('Tutorial catches duplicate food, wrong sauce and excess gravy; reset recovers',()=>{
 for(const mistake of ['duplicate','sauce','overpour']){
  const game=new Game();game.start(true,undefined,3);
  game.active.items.forEach(key=>game.addFood(key));
  if(mistake==='duplicate')game.addFood('rice');
  if(mistake==='sauce')game.gravy[SAUCES.find(key=>!game.active.sauces.includes(key))]=.1;
  if(mistake==='overpour')game.pour(game.active.sauces[0],game.active.target+.2);
  assert.equal(tutorialTask(game,SAUCES).kind,'reset');game.clear();assert.deepEqual(tutorialTask(game,SAUCES),{kind:'food',key:'rice'});
 }
});
test('Tutorial requires every requested sauce even when total quantity matches',()=>{
 const game=new Game();game.start(true);game.active.sauces=['fishCurry','dhal'];game.active.items.forEach(key=>game.addFood(key));game.pour('fishCurry',game.active.target);
 assert.deepEqual(tutorialTask(game,SAUCES),{kind:'sauce',key:'dhal'});
});
