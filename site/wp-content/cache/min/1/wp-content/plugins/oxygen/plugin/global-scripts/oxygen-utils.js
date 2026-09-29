(function(){const is={arr:function(a){return Array.isArray(a)},obj:function(a){return Object.prototype.toString.call(a).includes("Object")},str:function(a){return typeof a==="string"},fnc:function(a){return typeof a==="function"},und:function(a){return typeof a==="undefined"},nil:function(a){return is.und(a)||a===null},};function getMediaQueryString(minWidth,maxWidth){if(minWidth&&maxWidth){return `(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`}
if(maxWidth){return `(max-width: ${maxWidth}px)`}
if(minWidth){return `(min-width: ${minWidth}px)`}
return null}
function matchAnyMedia(){const{BASE_BREAKPOINT_ID,breakpoints}=window.BreakdanceFrontend.data;return breakpoints.filter((b)=>b.id!==BASE_BREAKPOINT_ID).some((b)=>matchMedia(b))}
function matchMedia(idOrBreakpoint){const{BASE_BREAKPOINT_ID,breakpoints}=window.BreakdanceFrontend.data;const isId=typeof idOrBreakpoint==="string";const breakpoint=isId?breakpoints.find((b)=>b.id===idOrBreakpoint):idOrBreakpoint;if(!breakpoint)return!1;if(breakpoint.id===BASE_BREAKPOINT_ID)return!matchAnyMedia();const{minWidth,maxWidth}=breakpoint;const mediaQuery=getMediaQueryString(minWidth,maxWidth);return window.matchMedia(mediaQuery).matches}
function getCurrentBreakpoint(breakpointIds){const{BASE_BREAKPOINT_ID,breakpoints}=window.BreakdanceFrontend.data;const activeBreakpoint=breakpoints.filter((b)=>{if(!breakpointIds)return!0;return breakpointIds.includes(b.id)}).sort((a,b)=>a.maxWidth-b.maxWidth).find((b)=>matchMedia(b));return(activeBreakpoint||breakpoints.find((b)=>b.id===BASE_BREAKPOINT_ID))}
function selectString(str){try{return document.querySelectorAll(str)}catch(e){return null}}
function toArray(o){if(is.arr(o)){return o}
if(is.str(o)){o=selectString(o)||o}
if(o instanceof NodeList||o instanceof HTMLCollection){return[].slice.call(o)}
return[o]}
function cloneObject(obj){return JSON.parse(JSON.stringify(obj))}
function mergeObjects(obj1,source){const target=cloneObject(obj1);if(!is.obj(source)){return target}
Object.keys(source).forEach((key)=>{const targetValue=target[key];const sourceValue=source[key];if(is.obj(targetValue)&&is.obj(sourceValue)){target[key]=mergeObjects(Object.assign({},targetValue),sourceValue)}else if(!is.nil(sourceValue)){target[key]=sourceValue}});return target}
function on(eventName,element,callback){if(!is.fnc(callback)){callback=element;element=null}
if(element){toArray(element).forEach((el)=>{el.addEventListener(eventName,callback)})}else{window.addEventListener(eventName,callback)}}
function off(eventName,element,callback){if(!is.fnc(callback)){callback=element;element=null}
if(element){toArray(element).forEach((el)=>{el.removeEventListener(eventName,callback)})}else{window.removeEventListener(eventName,callback)}}
function onResize(callback){const resizeObserver=new ResizeObserver(callback);resizeObserver.observe(document.body);return()=>{resizeObserver.disconnect()}}
function debounce(callback,wait,immediate){let timeout;return function(){const context=this,args=arguments;const later=function(){timeout=null;if(!immediate)callback.apply(context,args)};const callNow=immediate&&!timeout;clearTimeout(timeout);timeout=setTimeout(later,wait);if(callNow)callback.apply(context,args)}}
function throttle(callback,wait){let waiting=!1;return function(){if(!waiting){callback.apply(this,arguments);waiting=!0;setTimeout(()=>{waiting=!1},wait)}}}
function prefersReducedMotion(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}
function makeAjaxRequest(url,options){return fetch(url,options)}
function isBuilder(){try{return!!window.parent.Breakdance}catch(e){return!1}}
if(!window.BreakdanceFrontend){window.BreakdanceFrontend={}}
window.BreakdanceFrontend.utils={is,getCurrentBreakpoint,getMediaQueryString,matchMedia,matchAnyMedia,toArray,cloneObject,mergeObjects,on,off,onResize,debounce,throttle,prefersReducedMotion,makeAjaxRequest,isBuilder,};if(!window.OxygenFrontend){window.OxygenFrontend={}}
window.OxygenFrontend.utils=window.BreakdanceFrontend.utils})()