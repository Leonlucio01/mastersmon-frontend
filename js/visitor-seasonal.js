/* MastersMon visitor seasonal theme: Oct 01 - Nov 15 inclusive, America/Lima. */
(function(){'use strict';
  var params = new URLSearchParams(location.search);
  var override = params.get('halloween');
  var date = new Intl.DateTimeFormat('en-US', {timeZone:'America/Lima',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  var month = Number(date.find(function(x){return x.type==='month'}).value);
  var day = Number(date.find(function(x){return x.type==='day'}).value);
  var active = month === 10 || (month === 11 && day <= 15);
  if (override === '1') active = true;
  if (override === '0') active = false;
  document.documentElement.classList.toggle('mm-visitor-halloween',active);
})();
