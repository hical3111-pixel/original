'use strict';
const LAB_SOUND_KINDS={skill:'일반기',combo:'연계기',awk:'각성기'},LAB_SOUND_PHASES={cast:'시작 · 기 모으기',hit:'적중',finish:'마지막 강타'};
function labSoundOwner(){const kind=$('soundKind').value,id=$('soundPreview').value;return soundOwner(kind,id)}
function labChooseSound(owner,phase,id){const slot=SFX_SCHOOL[owner.school]?.files?.[owner.kind]?.[phase];if(!LAB_MODE||!slot?.candidates.includes(id))return false;labSoundChoices[sfxChoiceKey(owner,phase)]=id;return true}
function labSoundText(){const lines=['끝없는 검로 · 효과음 선택표 v1','수련장 임시 선택 (저장되지 않음)'];for(const school of Object.keys(SFX_SCHOOL))for(const kind of Object.keys(LAB_SOUND_KINDS))for(const phase of Object.keys(LAB_SOUND_PHASES)){
  const owner={school,kind},id=sfxChoice(owner,phase);lines.push(`${sfxChoiceKey(owner,phase)} = ${id} | ${SFX_FILES[id].path} | ${SFX_FILES[id].label}`)}return lines.join('\n')}
async function labExportSounds(write=text=>navigator.clipboard.writeText(text)){
  const text=labSoundText();try{await write(text);$('soundStatus').textContent='선택표를 복사했습니다. AI에게 붙여 넣어 주세요.';return true}
  catch(e){$('soundCopyText').hidden=false;$('soundCopyText').value=text;$('soundCopyText').focus();$('soundCopyText').select();$('soundStatus').textContent='자동 복사가 막혀 있습니다. 아래 선택표를 길게 눌러 복사해 주세요.';return false}
}
function labSoundPause(){lab.repeat=false;$('labRepeat').checked=false;labClear();ensureAudio();return sfxPlaybackEpoch}
async function labAudition(id){
  const owner=labSoundOwner(),phase=$('soundPhase').value;if(!owner||!SFX_FILES[id])return false;
  const epoch=labSoundPause();if(!S.sound||S.volume===0){$('soundStatus').textContent='소리를 켜고 음량을 올려 주세요.';return false}
  $('soundStatus').textContent='소리 불러오는 중…';const ac=AC,buffer=await loadSfx(id,ac);
  if(epoch!==sfxPlaybackEpoch||ac!==AC||!S.sound||S.volume===0)return false;
  let played=false;try{played=buffer?playSfxBuffer(id,buffer,owner,phase):synthSchoolCue(owner,phase)}catch(e){played=synthSchoolCue(owner,phase)}
  $('soundStatus').textContent=buffer?SFX_FILES[id].label+' · '+(phase==='finish'?'파일 + 낮은 강타음':'후보 재생'):'파일을 재생할 수 없어 합성 대체음을 들려드립니다.';return played;
}
async function labSoundPreview(){
  const owner=labSoundOwner();if(!owner)return false;const epoch=labSoundPause();$('soundStatus').textContent='선택한 소리를 준비하는 중…';
  const owners=[owner];if(owner.kind==='combo')owners.push(soundOwner('skill',owner.id));const buffers=(await Promise.all(owners.map(warmSchoolFiles))).flat();
  if(epoch!==sfxPlaybackEpoch)return false;
  const played=labPlay(owner.kind,owner.id);$('soundStatus').textContent='선택한 조합으로 연출 재생'+(buffers.some(b=>!b)?' · 불러오지 못한 소리는 합성 대체':'');return played;
}
function renderLabSoundCandidates(){
  const owner=labSoundOwner(),phase=$('soundPhase').value,slot=SFX_SCHOOL[owner.school].files[owner.kind][phase],chosen=sfxChoice(owner,phase);
  $('soundCandidates').innerHTML=slot.candidates.map(id=>`<div class="sound-candidate"><label><input type="radio" name="soundChoice" value="${id}" ${id===chosen?'checked':''}><span>${SFX_FILES[id].label}<small>${SFX_FILES[id].path}${id===slot.selected?' · 임시 기본값':''}</small></span></label><button type="button" data-listen="${id}">듣기</button></div>`).join('');
}
function renderLabSoundPreview(){
  const school=$('soundSchool').value,kind=$('soundKind').value,items=kind==='skill'?schoolSkills(SCHOOLS.find(s=>s.id===school)):kind==='combo'?COMBOS.filter(c=>c.school===school):AWK.filter(a=>a.id===SCHOOLS.find(s=>s.id===school).awk);
  $('soundPreview').innerHTML=items.map(a=>`<option value="${kind==='combo'?a.a:a.id}">${a.name}</option>`).join('');renderLabSoundCandidates();
}
function buildLabSounds(){
  const box=document.createElement('section');box.className='lab-sounds';box.innerHTML=`<button type="button" id="openLabSounds" aria-expanded="false" aria-controls="soundPicker">소리 고르기 · 진홍 / 빙정</button><div id="soundPicker" hidden><p>후보를 듣고 ○를 눌러 선택하세요. 이 탭에서만 적용됩니다. 연출로 비교한 뒤 선택표를 복사해 AI에게 전달하세요.</p><div class="sound-filters"><label>계열 <select id="soundSchool"><option value="crimson">진홍</option><option value="frost">빙정</option></select></label><label>종류 <select id="soundKind">${Object.entries(LAB_SOUND_KINDS).map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}</select></label><label>단계 <select id="soundPhase">${Object.entries(LAB_SOUND_PHASES).map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}</select></label></div><div id="soundCandidates"></div><label class="sound-preview-label">확인할 연출 <select id="soundPreview"></select></label><button type="button" id="soundPlay">선택한 소리로 연출 재생</button><button type="button" id="soundCopy">선택 결과 복사</button><div id="soundStatus" role="status">파일 이름을 기준으로 임시 선택했습니다. 강타 후보는 합성 저음을 함께 재생합니다.</div><textarea id="soundCopyText" aria-label="복사할 소리 선택표" readonly hidden></textarea></div>`;
  $('labPanel').insertBefore(box,$('labCatalog'));
  $('openLabSounds').onclick=()=>{const open=$('soundPicker').hidden;$('soundPicker').hidden=!open;$('openLabSounds').setAttribute('aria-expanded',open)};
  $('soundSchool').onchange=$('soundKind').onchange=()=>{labSoundPause();renderLabSoundPreview()};$('soundPhase').onchange=()=>{labSoundPause();renderLabSoundCandidates()};
  $('soundCandidates').onchange=e=>{if(e.target.name==='soundChoice'){labSoundPause();labChooseSound(labSoundOwner(),$('soundPhase').value,e.target.value);$('soundStatus').textContent='선택했습니다. 연출로 확인하거나 다음 단계를 고르세요.'}};
  $('soundCandidates').onclick=e=>{const b=e.target.closest('[data-listen]');if(b)labAudition(b.dataset.listen)};
  $('soundPlay').onclick=labSoundPreview;$('soundCopy').onclick=()=>labExportSounds();renderLabSoundPreview();
}
