import{d as E,c as a,F as g,r as R,o as t,a as G,E as H,_ as f,b as n,p as $,e as S,t as p,f as O,g as v,h as J,w as Q,i as W,j as C,k as D,l as X,m as Y,n as h,q as N,u as s,s as w,v as m,P as Z,D as T,x as ee,y as se,z as P,A as te,B as ae,C as ne,G as B,H as oe}from"../main.js";const le=E({__name:"RelayEventsList",props:{events:null,pubKey:null,currentRelays:null},emits:["toggleRawData"],setup(e,{emit:c}){const d=u=>{c("toggleRawData",u)};return(u,i)=>(t(),a("div",null,[(t(!0),a(g,null,R(e.events,(o,l)=>(t(),G(H,{key:o.id,class:"event",onToggleRawData:d,event:o,pubKey:e.pubKey,index:l,showReplies:!0,hasReplyBtn:!0,sliceText:150,currentRelays:e.currentRelays},null,8,["event","pubKey","index","currentRelays"]))),128))]))}});const ce=f(le,[["__scopeId","data-v-9689244a"]]),ue=e=>($("data-v-2db5cc65"),e=e(),S(),e),re={class:"log"},_e=ue(()=>n("strong",null,"Relay events log",-1)),de={class:"log__list"},ie={class:"log__list-item"},ve={key:0},ge={key:1},pe=E({__name:"RelayLog",props:{eventsLog:null},setup(e){const c=e;return(d,u)=>(t(),a("div",re,[_e,n("ul",de,[(t(!0),a(g,null,R(c.eventsLog,i=>(t(),a("li",ie,[(t(!0),a(g,null,R(i,({type:o,value:l})=>(t(),a(g,null,[o==="text"?(t(),a("span",ve,p(l),1)):(t(),a("b",ge,p(l),1))],64))),256))]))),256))])]))}});const ye=f(pe,[["__scopeId","data-v-2db5cc65"]]),he=e=>($("data-v-c446f638"),e=e(),S(),e),we={id:"feed"},me={class:"columns"},Re={key:0,class:"connecting-notice"},Ee={key:0,class:"new-events__imgs"},fe=["src"],Ie=["src"],Le={class:"new-events__text"},be=he(()=>n("b",{class:"new-events__arrow"},"↑",-1)),ke=E({__name:"Feed",props:{eventsLog:null},emits:["loadNewRelayEvents"],setup(e,{emit:c}){const d=O.value,u=v(()=>B.value[0]),i=v(()=>B.value[1]),o=J(1),l=v(()=>Math.ceil(D.value.length/T)),I=oe(),L=v(()=>I.path);Q(()=>I.path,async()=>{o.value>1&&y(1)}),W(()=>{l.value>1&&y(1)});const K=r=>{h.toggleRawData(r)},y=async r=>{const _=C.value;if(!_)return;const b=T,k=(r-1)*b,U=k+b,V=D.value.slice().reverse().slice(k,U),x=await _.list([{ids:V}]),j=x.map(q=>q.pubkey),z=await _.list([{kinds:[0],authors:j}]);let F=X(x,z);const M=[_.url];await Y(F,M,d),h.update(F),o.value=r},A=()=>{c("loadNewRelayEvents")};return(r,_)=>(t(),a("div",we,[n("div",me,[n("div",{class:N(["events",{"d-md-none":s(L)==="/log"}])},[s(ee).value?(t(),a("div",Re," Loading "+p(s(C)?"new":"")+" relay feed... ",1)):w("",!0),s(se).value?(t(),a("div",{key:1,onClick:A,class:"new-events"},[s(P).value?(t(),a("div",Ee,[n("img",{class:"new-events__img",src:s(u),alt:"img"},null,8,fe),n("img",{class:"new-events__img",src:s(i),alt:"img"},null,8,Ie)])):w("",!0),n("span",Le,p(s(te).value)+" new notes",1),be])):w("",!0),m(ce,{events:s(h).value,pubKey:s(ae).value,showImages:s(P).value,onToggleRawData:K,currentRelays:s(ne).value},null,8,["events","pubKey","showImages","currentRelays"]),m(Z,{pagesCount:s(l),currentPage:o.value,onShowPage:y},null,8,["pagesCount","currentPage"])],2),n("div",{class:N(["log-wrapper",{"d-md-none":s(L)!=="/log"}])},[m(ye,{eventsLog:e.eventsLog},null,8,["eventsLog"])],2)])]))}});const Ce=f(ke,[["__scopeId","data-v-c446f638"]]);export{Ce as default};
