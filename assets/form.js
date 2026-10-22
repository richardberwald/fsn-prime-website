(function(){
  var form=document.getElementById('join-form'); if(!form) return;
  var msg=form.querySelector('.form-msg'), btn=form.querySelector('button[type=submit]');
  var CAL='https://scheduler.recruitcrm.io/scheduler?config_id=fa96d1b8-2f5f-4f34-b53d-71d1555472fd';
  var fallback=' Mail ons op <a href="mailto:rberwald@financialsystemsnetwork.nl">rberwald@financialsystemsnetwork.nl</a> of <a href="'+CAL+'" target="_blank" rel="noopener">plan een gesprek</a>.';
  function readFile(f){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(String(r.result).split(',')[1]);};r.onerror=rej;r.readAsDataURL(f);});}
  form.addEventListener('submit',async function(e){
    e.preventDefault(); msg.className='form-msg'; msg.textContent='';
    if(!form.first_name.value.trim()||!form.last_name.value.trim()||!form.email.value||!form.email.checkValidity()){msg.className='form-msg err';msg.textContent='Vul je naam en een geldig e-mailadres in.';return;}
    if(!form.consent.checked){msg.className='form-msg err';msg.textContent='Vink het akkoord voor gegevensopslag aan.';return;}
    var d={route:form.route.value,first_name:form.first_name.value,last_name:form.last_name.value,email:form.email.value,phone:form.phone.value,linkedin:form.linkedin.value,focus:form.focus.value,hours:form.hours.value,message:form.message.value,website:form.website.value,consent:true};
    var f=form.cv.files[0];
    if(f){ if(f.size>4*1024*1024){msg.className='form-msg err';msg.textContent='Je cv is groter dan 4 MB.';return;} d.cv={name:f.name,type:f.type,data:await readFile(f)}; }
    btn.disabled=true; btn.textContent='Bezig met versturen...';
    try{
      var r=await fetch('/api/aanmelden',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
      var j=await r.json().catch(function(){return{};});
      if(r.ok&&j.ok){form.reset();msg.className='form-msg ok';msg.textContent='Dank je, '+d.first_name+'. We nemen binnen twee werkdagen contact met je op.';}
      else throw 0;
    }catch(err){msg.className='form-msg err';msg.innerHTML='Er ging iets mis bij het versturen.'+fallback;}
    btn.disabled=false; btn.textContent='Verstuur aanmelding';
  });
})();
