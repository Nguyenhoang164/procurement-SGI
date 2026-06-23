@echo off
cd /d C:\Users\kamit\Desktop\procurement-SGI\backend

:: Create a simple Node.js script to fix the file
(
  echo const fs = require('fs');
  echo const path = 'C:\\Users\\kamit\\Desktop\\procurement-SGI\\frontend\\src\\pages\\WaybillNew.js';
  echo let content = fs.readFileSync(path, 'utf8');
  echo 
  echo // 1. Add manualTotalCny to fromPOItems
  echo content = content.replace(
  echo   'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n      }));',
  echo   'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n        manualTotalCny: undefined,\n      }));'
  echo );
  echo 
  echo // 2. Add to addSelectedItems
  echo content = content.replace(
  echo   /shippingMethod: item\.shippingMethod \|\| '\'+',\n        \});/,
  echo   'shippingMethod: item.shippingMethod || \'\',\n          manualTotalCny: undefined,\n        });'
  echo );
  echo 
  echo // 3. Add to productsPayload
  echo content = content.replace(
  echo   /unitPriceVC: p\.unitPriceVC \|\| '\'+',\n      packageCount: p\.packageCount /,
  echo   'unitPriceVC: p.unitPriceVC || \'\',\n      manualTotalCny: p.manualTotalCny,\n      packageCount: p.packageCount'
  echo );
  echo 
  echo fs.writeFileSync(path, content, 'utf8');
  echo console.log('Step 1 done');
) > C:\Users\kamit\Desktop\procurement-SGI\backend\temp_fix.js

node C:\Users\kamit\Desktop\procurement-SGI\backend\temp_fix.js
