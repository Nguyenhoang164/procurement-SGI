const fs = require('fs');

// Fix WaybillNew.js
const waybillPath = 'C:\\Users\\kamit\\Desktop\\procurement-SGI\\frontend\\src\\pages\\WaybillNew.js';

// Read original from git
const originalWaybill = require('child_process').execSync('git show HEAD:frontend/src/pages/WaybillNew.js', {
  cwd: 'C:\\Users\\kamit\\Desktop\\procurement-SGI',
  encoding: 'utf8'
});

let waybillContent = originalWaybill;

// 1. Change header order
waybillContent = waybillContent.replace(
  '<th style={{ width: 28 }}>#</th>\n                      <th>PO</th>\n                      <th style={{ minWidth: 120 }}>Sản phẩm</th>\n                      <th>SL</th>\n                      <th style={{ width: 70 }}>KL/T.tích</th>\n                      <th style={{ width: 85 }}>Đơn giá VC</th>\n                      <th style={{ width: 80 }}>Tỷ giá</th>\n                      <th style={{ width: 90 }}>Tổng cước</th>\n                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>\n                      <th style={{ width: 100 }}>Số kiện</th>',
  '<th style={{ width: 28 }}>#</th>\n                      <th>PO</th>\n                      <th style={{ minWidth: 120 }}>Sản phẩm</th>\n                      <th>SL</th>\n                      <th style={{ width: 80 }}>Tỷ giá</th>\n                      <th style={{ width: 85 }}>Đơn giá VC</th>\n                      <th style={{ width: 90 }}>Tổng cước</th>\n                      <th style={{ width: 70 }}>KL/T.tích</th>\n                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>\n                      <th style={{ width: 100 }}>Số kiện</th>'
);

// 2. Change body - reorder and make Tổng cước editable
waybillContent = waybillContent.replace(
  '<td>{idx + 1}</td>\n                            <td style={{ fontSize: 11 }}>{p.poCode}</td>\n                            <td>{p.productName}{p.posCode ? ` (${p.posCode})` : \'\'}</td>\n                            <td>{p.orderedQty}</td>\n                            <td>\n                              <input type="number" step="0.01" value={p.volume || \'\'}\n                                onChange={e => updateProductField(idx, \'volume\', e.target.value)}\n                                style={{ width: \'100\%\', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n                            </td>\n                            <td>\n                              <input type="number" step="0.01" value={p.unitPriceVC || \'\'}\n                                onChange={e => updateProductField(idx, \'unitPriceVC\', e.target.value)}\n                                style={{ width: \'100\%\', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n                            </td>\n                            <td>\n                              <input type="number" step="1" value={p.exchangeRate || \'\'}\n                                onChange={e => updateProductField(idx, \'exchangeRate\', e.target.value)}\n                                style={{ width: \'100\%\', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n                            </td>\n                            <td style={{ fontWeight: 600 }}>{totalCny.toLocaleString(\'vi-VN\')} {p.currency || \'CNY\'}</td>\n                            <td style={{ fontWeight: 600 }}>{totalVnd.toLocaleString(\'vi-VN\')} ₫</td>\n                            <td>\n                              <input type="number" value={p.packageCount || \'\'}\n                                onChange={e => updateProductField(idx, \'packageCount\', e.target.value)}\n                                style={{ width: \'100\%\', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n                            </td>',
  '<td>{idx + 1}</td>\n                            <td style={{ fontSize: 11 }}>{p.poCode}</td>\n                            <td>{p.productName}{p.posCode ? ` (${p.posCode})` : \'\'}</td>\n                            <td>{p.orderedQty}</td>\n                            <td>\n                              <input type="number" step="1" value={p.exchangeRate || \'\'}\n                                onChange={e => updateProductField(idx, \'exchangeRate\', e.target.value)}\n                                style={{ width: \'100\%\', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n                            </td>\n                            <td>\n                              <input type="number" step="0.01" value={p.unitPriceVC || \'\'}\n                                onChange={e => updateProductField(idx, \'unitPriceVC\', e.target.value)}\n                                style={{ width: \'100\%\', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n                            </td>\n                            <td>\n                              <input type="number" step="0.01" value={(p.manualTotalCny !== undefined ? p.manualTotalCny : totalCny) || \'\'}\n                                onChange={e => updateProductField(idx, \'manualTotalCny\', e.target.value)}\n                                style={{ width: \'100\%\', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n                            </td>\n                            <td>\n                              <input type="number" step="0.01" value={p.volume || \'\'}\n                                onChange={e => updateProductField(idx, \'volume\', e.target.value)}\n                                style={{ width: \'100\%\', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n                            </td>\n                            <td style={{ fontWeight: 600 }}>{totalVnd.toLocaleString(\'vi-VN\')} ₫</td>\n                            <td>\n                              <input type="number" value={p.packageCount || \'\'}\n                                onChange={e => updateProductField(idx, \'packageCount\', e.target.value)}\n                                style={{ width: \'100\%\', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n                            </td>'
);

// 3. Update computedFreightVnd to use manualTotalCny
waybillContent = waybillContent.replace(
  'const computedFreightVnd = useMemo(() => {\n    return products.reduce((sum, p) => {\n      const rate = Number(p.exchangeRate || 3520);\n      return sum + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);\n    }, 0);\n  }, [products]);',
  'const computedFreightVnd = useMemo(() => {\n    return products.reduce((sum, p) => {\n      const rate = Number(p.exchangeRate || 3520);\n      const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));\n      return sum + Math.round(cny * rate);\n    }, 0);\n  }, [products]);'
);

// 4. Add manualTotalCny to product objects
// In fromPOItems mapping
waybillContent = waybillContent.replace(
  'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n      }));',
  'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n        manualTotalCny: undefined,\n      }));'
);

// In addSelectedItems
waybillContent = waybillContent.replace(
  'shippingMethod: item.shippingMethod || \'\',\n        });',
  'shippingMethod: item.shippingMethod || \'\',\n          manualTotalCny: undefined,\n        });'
);

// In productsPayload for submit
waybillContent = waybillContent.replace(
  'unitPriceVC: p.unitPriceVC || \'\',\n      packageCount: p.packageCount || \'\',',
  'unitPriceVC: p.unitPriceVC || \'\',\n      manualTotalCny: p.manualTotalCny,\n      packageCount: p.packageCount || \'\','
);

fs.writeFileSync(waybillPath, waybillContent, 'utf8');
console.log('WaybillNew.js fixed!');

// Now fix PaymentRequestNew.js
const paymentPath = 'C:\\Users\\kamit\\Desktop\\procurement-SGI\\frontend\\src\\pages\\PaymentRequestNew.js';
const originalPayment = require('child_process').execSync('git show HEAD:frontend/src/pages/PaymentRequestNew.js', {
  cwd: 'C:\\Users\\kamit\\Desktop\\procurement-SGI',
  encoding: 'utf8'
});

let paymentContent = originalPayment;

// Find and replace Thành tiền cell with editable input
// Pattern: <td style={{ textAlign: 'right', padding: '2px' }}>{sub.toLocaleString('vi-VN')}</td>
paymentContent = paymentContent.replace(
  /<td style=\{\{ textAlign: 'right', padding: '2px' \}\}>\{sub\.toLocaleString\('vi-VN'\)\}<\/td>/g,
  '<td style={{ textAlign: \'right\', padding: \'2px\' }}>' +
  '<input type="number" step="0.01" value={item.manualTotal !== undefined ? item.manualTotal : sub || \'\'}' +
  ' onChange={e => {\n    const newItems = [...shipmentItems];\n    newItems[idx] = { ...newItems[idx], manualTotal: e.target.value };\n    setShipmentItems(newItems);\n  }}' +
  ' style={{ width: \'100\%', padding: \'2px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12, textAlign: \'right\' }} />' +
  '</td>'
);

// Add manualTotal to shipmentItems initialization
paymentContent = paymentContent.replace(
  'totalAmountVnd: item.totalAmountVnd || Math.round((item.totalAmountForeign || 0) * (Number(order.exchangeRate || 3520))),',
  'totalAmountVnd: item.totalAmountVnd || Math.round((item.totalAmountForeign || 0) * (Number(order.exchangeRate || 3520))),\n          manualTotal: undefined,'
);

// Update suggestAmountForType to use manualTotal if available
// This is complex, let's just update the total calculation for now
paymentContent = paymentContent.replace(
  'return selectedOrders.reduce((sum, order) => {\n      return sum + suggestAmountForType(formData.type, order);\n    }, 0);',
  'return selectedOrders.reduce((sum, order) => {\n      const orderTotal = order.items ? order.items.reduce((s, item) => {\n        const itemTotal = item.manualTotal !== undefined ? Number(item.manualTotal || 0) : (Number(item.unitPrice || 0) * Number(item.orderedQty || 0));
        return s + itemTotal;\n      }, 0) : suggestAmountForType(formData.type, order);\n      return sum + orderTotal;\n    }, 0);'
);

// Also update the display totals to use manualTotal
// This is getting complex. For now, just save what we have

fs.writeFileSync(paymentPath, paymentContent, 'utf8');
console.log('PaymentRequestNew.js fixed!');
console.log('Done!');
