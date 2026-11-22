import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState, transition, spellingPrompt, wordsFor} from '../src/core.js';

const now = new Date('2026-11-22T12:00:00').getTime();
const apply = (state, action) => transition(state, action, now).state;
const answer = (state, value, extra = {}) => apply(state, {
  type:'answer', gameId:state.game.id, index:state.game.index, answer:value, ...extra
});

test('last wrong answer settles a completed 5/8 run and retries exactly its missed words', () => {
  let state=apply(initialState(), {type:'startGame',mode:'meaning'});
  const missed=[];
  for(let i=0;i<8;i++){
    const q=state.game.questions[i];
    if(i>=5) missed.push(q.id);
    state=answer(state, i<5?q.id:q.options.find(id=>id!==q.id));
    if(i<7) state=apply(state,{type:'nextQuestion'});
  }
  assert.equal(state.game.completed,true);
  assert.equal(state.game.score,5);
  assert.equal(state.coins,2);
  assert.deepEqual(state.game.mistakes.map(m=>m.id),missed);
  state=apply(state,{type:'retryMistakes',gameId:state.game.id});
  assert.deepEqual(new Set(state.game.questions.map(q=>q.id)),new Set(missed));
  assert.equal(state.game.retry,true);
});

test('unknown choice cannot touch hearts or history; motor errors only schedule explicit recall', () => {
  let state=apply(initialState(),{type:'startGame',mode:'flight'});
  const original=structuredClone(state);
  assert.throws(()=>answer(state,'undefined'),/选项/);
  assert.deepEqual(state,original);
  state=answer(state,'__miss');
  assert.equal(state.history.length,0);
  assert.equal(state.game.lives,2);
  const check={type:'checkMeaning',gameId:state.game.id,index:0,answer:state.game.questions[0].id};
  state=apply(state,check);
  assert.equal(state.history.length,1);
  assert.equal(state.history[0].rating,2);
  assert.equal(state.game.score,0);
  assert.throws(()=>apply(state,check));
  state=apply(state,{type:'nextQuestion'});
  state=answer(state,'',{timeout:true});
  state=apply(state,{type:'checkMeaning',skip:true,gameId:state.game.id,index:1});
  assert.equal(state.history.length,1);
  assert.equal(state.game.lives,1);
});

test('spelling masks grade exactly missing letters and omit empty rounds', () => {
  assert.equal(spellingPrompt('self-aware',1).answer,'elfaware');
  assert.equal(spellingPrompt("can't",1).answer,'ant');
  assert.equal(spellingPrompt('I',1).hidden.length,0);
  let state=initialState();
  const words=['I','self-aware',"can't"].map(term=>({word:term,meaning:term,phrase:term+' today',phraseZh:'示例',example:term+' today.',exampleZh:'示例。'}));
  state=apply(state,{type:'import',words});
  state=apply(state,{type:'settings',patch:{deck:'custom'}});
  state=apply(state,{type:'startGame',mode:'phrase'});
  assert.equal(state.game.questions.length,8);
  while(!state.game.completed){
    const q=state.game.questions[state.game.index],w=wordsFor(state).find(w=>w.id===q.id);
    const text=spellingPrompt(w.word,q.round).answer;
    assert.ok(text);assert.match(text,/^[a-z]+$/i);
    state=answer(state,text);assert.equal(state.game.feedback.correct,true);
    state=apply(state,{type:'nextQuestion'});
  }
});
