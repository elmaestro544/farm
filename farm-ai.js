/* Tanida Farm — AI Module v1
 * Single AI facade. The existing inline AI engine remains the compatibility backend;
 * this module exposes one stable public surface without polling or duplicate requests.
 */
(function(){
  'use strict';
  if(window.TanidaFarmAI) return;
  const api={
    ready:true,
    status(){return {connected:typeof window.testAIConnection==='function',generator:typeof window.generateAIInvestmentPlan==='function'}},
    test(){return typeof window.testAIConnection==='function'?window.testAIConnection():Promise.resolve(false)},
    generate(){return typeof window.generateAIInvestmentPlan==='function'?window.generateAIInvestmentPlan():Promise.reject(new Error('AI engine is not available'))},
    refresh(){if(typeof window.markAIStale==='function')window.markAIStale();}
  };
  window.TanidaFarmAI=api;
})();
