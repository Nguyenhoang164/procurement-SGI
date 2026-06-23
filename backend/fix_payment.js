// Script to modify PaymentRequestNew.js
const fs = require('fs');

const filePath = 'C:\\Users\\kamit\\Desktop\\procurement-SGI\\frontend\\src\\pages\\PaymentRequestNew.js';

let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the table body row for products
// Looking for the pattern where Thành tiền is displayed
const oldProductRow = `<td style={{ textAlign: 'right', padding: '2px', whiteSpace: 'nowrap' }}>{sub.toLocaleString('vi-VN')}</td>`;

const newProductRow = `<td style={{ textAlign: 'right', padding: '2px', whiteSpace: 'nowrap' }}>
                              <input type="number" step="0.01" value={item.manualTotal !== undefined ? item.manualTotal : sub || ''}
                                onChange={e => {
                                  const newItems = [...shipmentItems];
                                  newItems[idx] = { ...newItems[idx], manualTotal: e.target.value };
                                  setShipmentItems(newItems);
                                }}
                                style={{ width: '100%', padding: '2px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
                            </td>`;

// Need to find the right context first
// Let's find the table header for the shipment items table
const headerPattern = /<th style=\{\{ textAlign: 'center', padding: '2px' \}\}>Số lượng<\/th>\s+<th style=\{\{ textAlign: 'right', padding: '2px' \}\}>Đơn giá<\/th>\s+<th style=\{\{ textAlign: 'right', padding: '2px' \}\}>Thành tiền<\/th>/;

const newHeaderPattern = `<th style={{ textAlign: 'center', padding: '2px' }}>Số lượng</th>
                          <th style={{ textAlign: 'right', padding: '2px' }}>Đơn giá</th>
                          <th style={{ textAlign: 'right', padding: '2px' }}>Thành tiền</th>`;

// Replace header
content = content.replace(headerPattern, newHeaderPattern);

// Now find the body cells for that column
// Looking for: <td style={{ textAlign: 'right', padding: '2px' }}>{sub.toLocaleString('vi-VN')}</td>
const bodyPattern = /<td style=\{\{ textAlign: 'right', padding: '2px' \}\}>\{sub\.toLocaleString\(\s*'vi-VN'\s*\)\}<\/td>/g;

const newBodyCell = `<td style={{ textAlign: 'right', padding: '2px' }}>
  <input type="number" step="0.01" value={item.manualTotal !== undefined ? item.manualTotal : sub || ''}
    onChange={e => {
      const newItems = [...shipmentItems];
      newItems[idx] = { ...newItems[idx], manualTotal: e.target.value };
      setShipmentItems(newItems);
    }}
    style={{ width: '100%', padding: '2px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
</td>`;

content = content.replace(bodyPattern, newBodyCell);

// Also need to update the shipmentItems initialization to include manualTotal
// Find where shipmentItems is set from selectedOrders
const itemsInitPattern = /setShipmentItems\(\s*selectedOrders\.map\(\s*order => \(\s*\{[^}]+\}\s*\)\)/;

// This is complex, let's try a different approach - find the useEffect that sets shipmentItems
const shipmentItemsInit = `    if (selectedOrders.length > 0) {
      const items = selectedOrders.flatMap(order =>
        (order.items || []).map(item => ({
          ...item,
          poCode: order.poCode || 'PO-' + order.id,
          orderedQty: item.orderedQty || order.orderedQty || 0,
          unitPrice: item.unitPrice || 0,
          currency: item.currency || order.currency || 'CNY',
          totalAmountForeign: item.totalAmountForeign || (Number(item.unitPrice || 0) * Number(item.orderedQty || 0)),
          totalAmountVnd: item.totalAmountVnd || Math.round((item.totalAmountForeign || 0) * (Number(order.exchangeRate || 3520))),
        }))
      );
      setShipmentItems(items);
    } else {
      setShipmentItems([]);
    }`;

const newShipmentItemsInit = `    if (selectedOrders.length > 0) {
      const items = selectedOrders.flatMap(order =>
        (order.items || []).map(item => ({
          ...item,
          poCode: order.poCode || 'PO-' + order.id,
          orderedQty: item.orderedQty || order.orderedQty || 0,
          unitPrice: item.unitPrice || 0,
          currency: item.currency || order.currency || 'CNY',
          totalAmountForeign: item.totalAmountForeign || (Number(item.unitPrice || 0) * Number(item.orderedQty || 0)),
          totalAmountVnd: item.totalAmountVnd || Math.round((item.totalAmountForeign || 0) * (Number(order.exchangeRate || 3520))),
          manualTotal: undefined,
        }))
      );
      setShipmentItems(items);
    } else {
      setShipmentItems([]);
    }`;

content = content.replace(shipmentItemsInit, newShipmentItemsInit);

// Update the total calculation to use manualTotal if available
// Find suggestTotalAmount calculation
const suggestPattern = /return selectedOrders\.reduce\(\s*\\(sum, order\\) => \{\s*return sum \+ suggestAmountForType\(formData\.type, order\)\;\s*\}, 0\)/;

// This is getting complex. Let me try a simpler approach - just make the changes we can

fs.writeFileSync(filePath, content, 'utf8');
console.log('PaymentRequestNew.js updated (partial)');
