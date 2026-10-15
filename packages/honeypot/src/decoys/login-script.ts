/**
 * What makes a mock login form "work" without ever asking the server: submitting waits a moment, as a real one would, and then says the login
 * failed. `fields` are the ids of the inputs (the first is the user name, the last is cleared), `message` builds the text from the user name
 */
export const loginScript = ({ form, fields, error, message }: { form: string; fields: string[]; error: string; message: string }): string =>
  `(function(){
var form=document.getElementById(${JSON.stringify(form)});
if(!form)return;
var box=document.getElementById(${JSON.stringify(error)});
var ids=${JSON.stringify(fields)};
form.addEventListener('submit',function(e){
e.preventDefault();
var button=form.querySelector('[type=submit]');
if(button)button.disabled=true;
var user=(document.getElementById(ids[0])||{}).value||'';
setTimeout(function(){
var password=document.getElementById(ids[ids.length-1]);
if(password)password.value='';
box.textContent=${message};
box.hidden=false;
if(button)button.disabled=false;
if(password)password.focus();
},700+Math.floor(Math.random()*600));
});
})();`;
