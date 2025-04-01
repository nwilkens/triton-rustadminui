"use strict";(self.webpackChunktriton_ui=self.webpackChunktriton_ui||[]).push([[602],{1602:(e,s,t)=>{t.r(s),t.d(s,{default:()=>n});var a=t(5043),r=t(3216),i=t(5475),l=t(6291),d=t(579);const n=()=>{const{uuid:e}=(0,r.g)(),[s,t]=(0,a.useState)(null),[n,m]=(0,a.useState)(!0),[c,x]=(0,a.useState)(null),[o,h]=(0,a.useState)("overview");(0,a.useEffect)((()=>{(async()=>{if(e)try{m(!0);const s=(await(0,l.Nj)(e)).data;t(s),x(null)}catch(r){var s,a;x((null===(s=r.response)||void 0===s||null===(a=s.data)||void 0===a?void 0:a.message)||"Failed to fetch network details")}finally{m(!1)}})()}),[e]);const g=e=>e?new Date(e).toLocaleDateString()+" "+new Date(e).toLocaleTimeString():"N/A",v=(e,s)=>e?"bg-blue-100 text-blue-800":s?"bg-purple-100 text-purple-800":"bg-gray-100 text-gray-800",u=(e,s)=>e?"Public":s?"Fabric":"Private";return n?(0,d.jsx)("div",{className:"flex justify-center items-center h-64",children:(0,d.jsx)("div",{className:"animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"})}):c||!s?(0,d.jsx)("div",{className:"rounded-md bg-red-50 p-4 m-4",children:(0,d.jsx)("div",{className:"flex",children:(0,d.jsxs)("div",{className:"ml-3",children:[(0,d.jsx)("h3",{className:"text-sm font-medium text-red-800",children:"Error loading network details"}),(0,d.jsx)("div",{className:"mt-2 text-sm text-red-700",children:(0,d.jsx)("p",{children:c||"Network data not available"})})]})})}):(0,d.jsxs)("div",{className:"px-4 sm:px-6 lg:px-8 py-6",children:[(0,d.jsx)("nav",{className:"mb-4 text-sm","aria-label":"Breadcrumb",children:(0,d.jsxs)("ol",{className:"flex items-center space-x-2",children:[(0,d.jsx)("li",{children:(0,d.jsx)(i.N_,{to:"/networks",className:"text-gray-500 hover:text-gray-700",children:"Networks"})}),(0,d.jsxs)("li",{className:"flex items-center",children:[(0,d.jsx)("svg",{className:"h-5 w-5 text-gray-400",fill:"currentColor",viewBox:"0 0 20 20",children:(0,d.jsx)("path",{fillRule:"evenodd",d:"M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z",clipRule:"evenodd"})}),(0,d.jsx)("span",{className:"ml-2 text-gray-700 font-medium",children:s.name})]})]})}),(0,d.jsxs)("div",{className:"bg-white shadow overflow-hidden sm:rounded-lg mb-6",children:[(0,d.jsxs)("div",{className:"px-4 py-5 sm:px-6 flex justify-between items-start",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("h1",{className:"text-2xl font-bold text-gray-900 flex items-center",children:s.name}),(0,d.jsx)("p",{className:"mt-1 max-w-2xl text-sm text-gray-500",children:s.uuid}),s.description&&(0,d.jsx)("p",{className:"mt-1 text-sm text-gray-600 italic",children:s.description})]}),(0,d.jsx)("div",{className:"flex space-x-3",children:(0,d.jsx)("span",{className:`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${v(s.public,s.fabric)}`,children:u(s.public,s.fabric)})})]}),(0,d.jsx)("div",{className:"border-t border-gray-200 px-4 py-5 sm:px-6",children:(0,d.jsxs)("div",{className:"grid grid-cols-1 gap-4 sm:grid-cols-3",children:[(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Subnet"}),(0,d.jsxs)("div",{className:"mt-1 text-sm text-gray-900 flex items-center",children:[(0,d.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-4 w-4 text-gray-400 mr-1",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"})}),s.subnet," ",s.netmask&&`/ ${s.netmask}`]})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"VLAN ID"}),(0,d.jsxs)("div",{className:"mt-1 text-sm text-gray-900 flex items-center",children:[(0,d.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-4 w-4 text-gray-400 mr-1",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"})}),s.vlan_id]})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Gateway"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900 font-mono",children:s.gateway||"N/A"})]})]})})]}),(0,d.jsxs)("div",{className:"bg-white shadow sm:rounded-lg",children:[(0,d.jsx)("div",{className:"border-b border-gray-200",children:(0,d.jsxs)("nav",{className:"-mb-px flex space-x-8 px-6","aria-label":"Tabs",children:[(0,d.jsx)("button",{onClick:()=>h("overview"),className:("overview"===o?"border-indigo-500 text-indigo-600":"border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")+" whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",children:"Overview"}),(0,d.jsx)("button",{onClick:()=>h("ips"),className:("ips"===o?"border-indigo-500 text-indigo-600":"border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")+" whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",children:"IP Addresses"}),(0,d.jsx)("button",{onClick:()=>h("vms"),className:("vms"===o?"border-indigo-500 text-indigo-600":"border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")+" whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",children:"Virtual Machines"})]})}),(0,d.jsxs)("div",{className:"p-6",children:["overview"===o&&(0,d.jsxs)("div",{className:"space-y-6",children:[(0,d.jsxs)("div",{className:"bg-gray-50 p-4 rounded-lg",children:[(0,d.jsx)("h3",{className:"text-lg leading-6 font-medium text-gray-900 mb-4",children:"Network Information"}),(0,d.jsxs)("div",{className:"grid grid-cols-1 gap-4 sm:grid-cols-2",children:[(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Name"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:s.name})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"UUID"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900 font-mono",children:s.uuid})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Network Type"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:(0,d.jsx)("span",{className:`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${v(s.public,s.fabric)}`,children:u(s.public,s.fabric)})})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Fabric Network"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:s.fabric?"Yes":"No"})]}),s.owner_uuid&&(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Owner"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900 font-mono",children:s.owner_uuid})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Created"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:g(s.created_at)})]}),s.updated_at&&(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Updated"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:g(s.updated_at)})]})]})]}),(0,d.jsxs)("div",{className:"bg-gray-50 p-4 rounded-lg",children:[(0,d.jsx)("h3",{className:"text-lg leading-6 font-medium text-gray-900 mb-4",children:"Network Configuration"}),(0,d.jsxs)("div",{className:"grid grid-cols-1 gap-4 sm:grid-cols-2",children:[(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Subnet"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:s.subnet})]}),s.netmask&&(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Netmask"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:s.netmask})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Gateway"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:s.gateway||"N/A"})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"VLAN ID"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:s.vlan_id})]})]})]})]}),"ips"===o&&(0,d.jsxs)("div",{className:"space-y-6",children:[(0,d.jsxs)("div",{className:"bg-gray-50 p-4 rounded-lg",children:[(0,d.jsx)("h3",{className:"text-lg leading-6 font-medium text-gray-900 mb-4",children:"IP Address Range"}),(0,d.jsxs)("div",{className:"grid grid-cols-1 gap-4 sm:grid-cols-2",children:[(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Provisioning Range Start"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900 font-mono",children:s.provision_start_ip})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Provisioning Range End"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900 font-mono",children:s.provision_end_ip})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Subnet"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:s.subnet})]}),s.netmask&&(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Netmask"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:s.netmask})]}),(0,d.jsxs)("div",{className:"sm:col-span-1",children:[(0,d.jsx)("div",{className:"text-sm font-medium text-gray-500",children:"Gateway"}),(0,d.jsx)("div",{className:"mt-1 text-sm text-gray-900",children:s.gateway||"N/A"})]})]})]}),(0,d.jsxs)("div",{className:"bg-gray-50 p-4 rounded-lg",children:[(0,d.jsx)("h3",{className:"text-lg leading-6 font-medium text-gray-900 mb-4",children:"IP Management"}),(0,d.jsxs)("div",{className:"text-center py-6",children:[(0,d.jsx)("svg",{className:"mx-auto h-12 w-12 text-gray-400",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1,d:"M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"})}),(0,d.jsx)("h3",{className:"mt-2 text-sm font-medium text-gray-900",children:"IP Usage Information"}),(0,d.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:"IP usage details will be added in a future update."})]})]})]}),"vms"===o&&(0,d.jsx)("div",{className:"space-y-6",children:(0,d.jsxs)("div",{className:"bg-gray-50 p-4 rounded-lg",children:[(0,d.jsx)("h3",{className:"text-lg leading-6 font-medium text-gray-900 mb-4",children:"Virtual Machines on this Network"}),(0,d.jsxs)("div",{className:"text-center py-6",children:[(0,d.jsx)("svg",{className:"mx-auto h-12 w-12 text-gray-400",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1,d:"M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"})}),(0,d.jsx)("h3",{className:"mt-2 text-sm font-medium text-gray-900",children:"VM Information Coming Soon"}),(0,d.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:"The list of VMs connected to this network will be available in a future update."})]})]})})]})]}),(0,d.jsxs)("div",{className:"mt-6 flex flex-col-reverse space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse",children:[(0,d.jsxs)("button",{type:"button",className:"inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",children:[(0,d.jsx)("svg",{className:"-ml-1 mr-2 h-5 w-5 text-gray-500",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"})}),"Edit Network"]}),(0,d.jsxs)("button",{type:"button",className:"inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",children:[(0,d.jsx)("svg",{className:"-ml-1 mr-2 h-5 w-5 text-red-500",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"})}),"Delete Network"]})]})]})}}}]);
//# sourceMappingURL=602.37e4cda4.chunk.js.map