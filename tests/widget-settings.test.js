import assert from 'node:assert/strict';
import test from 'node:test';
import {syncWidgetSettings} from '../electron/widget-settings.js';

test('only placement and display changes re-anchor a manually dragged widget', () => {
  const calls = [];
  const widget = {
    getSize: () => [330,432],
    setSize: (width,height) => calls.push([width,height]),
    setOpacity: () => calls.push('opacity'),
    hide: () => calls.push('hide'),
    showInactive: () => calls.push('show')
  };
  const settings = {widgetWidth:330,widgetHeight:432,widget:true,opacity:1,display:'primary',corner:'top-right',newLimit:10};
  const apply = changes => syncWidgetSettings(widget,settings,{...settings,...changes},() => calls.push('position'),false);
  apply({accent:'en-GB', newLimit:5});
  assert.deepEqual(calls, []);
  apply({widgetWidth:400});
  apply({opacity:.9});
  apply({widget:false});
  apply({corner:'top-left'});
  apply({display:'other'});
  assert.deepEqual(calls, [[400,432],'opacity','hide','position','position']);
});
