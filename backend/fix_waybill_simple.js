const fs = require('fs');
const { execSync } = require('child_process');

// Fix WaybillNew.js
const waybillPath = 'C:\\Users\\kamit\\Desktop\\procurement-SGI\\frontend\\src\\pages\\WaybillNew.js';

const originalWaybill = execSync('git show HEAD:frontend/src/pages/WaybillNew.js', {
  cwd: 'C:\\Users\\kamit\\Desktop\\procurement-SGI',
  encoding: 'utf8'
});

let content = originalWaybill;

// 1. Change header - move Tỷ giá and Tổng cước before KL/T.tích
content = content.replace(
  '<th style={{ width: 70 }}>KL/T.tích</th>\n                      <th style={{ width: 85 }}>Đơn giá VC</th>\n                      <th style={{ width: 80 }}>Tỷ giá</th>\n                      <th style={{ width: 90 }}>Tổng cước</th>\n                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>',
  '<th style={{ width: 80 }}>Tỷ giá</th>\n                      <th style={{ width: 85 }}>Đơn giá VC</th>\n                      <th style={{ width: 90 }}>Tổng cước</th>\n                      <th style={{ width: 70 }}>KL/T.tích</th>\n                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>'
);

// 2. Update computedFreightVnd to support manualTotalCny
content = content.replace(
  'const computedFreightVnd = useMemo(() => {\n    return products.reduce((sum, p) => {\n      const rate = Number(p.exchangeRate || 3520);\n      return sum + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);\n    }, 0);\n  }, [products]);',
  'const computedFreightVnd = useMemo(() => {\n    return products.reduce((sum, p) => {\n      const rate = Number(p.exchangeRate || 3520);\n      const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));
      return sum + Math.round(cny * rate);\n    }, 0);\n  }, [products]);'
);

// 3. Add manualTotalCny to initial product mapping
content = content.replace(
  'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n      }));',
  'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n        manualTotalCny: undefined,\n      }));'
);

// 4. Add to addSelectedItems
content = content.replace(
  'shippingMethod: item.shippingMethod || \'\',\n        });',
  'shippingMethod: item.shippingMethod || \'\',\n          manualTotalCny: undefined,\n        });'
);

// 5. Add to productsPayload
content = content.replace(
  'unitPriceVC: p.unitPriceVC || \'\',\n      packageCount: p.packageCount || \'\',',
  'unitPriceVC: p.unitPriceVC || \'\',\n      manualTotalCny: p.manualTotalCny,\n      packageCount: p.packageCount || \'\','
);

// 6. Change table body - make Tổng cước editable and reorder
const oldBody = `                            <td>{idx + 1}</td>
                            <td style={{ fontSize: 11 }}>{p.poCode}</td>
                            <td>{p.productName}{p.posCode ? \` (\${p.posCode})\` : ''}</td>
                            <td>{p.orderedQty}</td>
                            <td>
                              <input type="number" step="0.01" value={p.volume || ''}
                                onChange={e => updateProductField(idx, 'volume', e.target.value)}
                                style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }} />
                            </td>
                            <td>
                              <input type="number" step="0.01" value={p.unitPriceVC || ''}
                                onChange={e => updateProductField(idx, 'unitPriceVC', e.target.value)}
                                style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }} />
                            </td>
                            <td>
                              <input type="number" step="1" value={p.exchangeRate || ''}
                                onChange={e => updateProductField(idx, 'exchangeRate', e.target.value)}
                                style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }} />
                            </td>
                            <td style={{ fontWeight: 600 }}>{totalCny.toLocaleString('vi-VN')} {p.currency || 'CNY'}</td>
                            <td style={{ fontWeight: 600 }}>{totalVnd.toLocaleString('vi-VN')} ₫</td>
                            <td>
                              <input type="number" value={p.packageCount || ''}
                                onChange={e => updateProductField(idx, 'packageCount', e.target.value)}
                                style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }} />
                            </td>`;

const newBody = `                            <td>{idx + 1}</td>
                            <td style={{ fontSize: 11 }}>{p.poCode}</td>
                            <td>{p.productName}{p.posCode ? \` (\${p.posCode})\` : ''}</td>
                            <td>{p.orderedQty}</td>
                            <td>
                              <input type="number" step="1" value={p.exchangeRate || ''}
                                onChange={e => updateProductField(idx, 'exchangeRate', e.target.value)}
                                style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }} />
                            </td>
                            <td>
                              <input type="number" step="0.01" value={p.unitPriceVC || ''}
                                onChange={e => updateProductField(idx, 'unitPriceVC', e.target.value)}
                                style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }} />
                            </td>
                            <td>
                              <input type="number" step="0.01" value={(p.manualTotalCny !== undefined ? p.manualTotalCny : totalCny) || ''}
                                onChange={e => updateProductField(idx, 'manualTotalCny', e.target.value)}
                                style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }} />
                            </td>
                            <td>
                              <input type="number" step="0.01" value={p.volume || ''}
                                onChange={e => updateProductField(idx, 'volume', e.target.value)}
                                style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }} />
                            </td>
                            <td style={{ fontWeight: 600 }}>{totalVnd.toLocaleString('vi-VN')} ₫</td>
                            <td>
                              <input type="number" value={p.packageCount || ''}
                                onChange={e => updateProductField(idx, 'packageCount', e.target.value)}
                                style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }} />
                            </td>`;

content = content.replace(oldBody, newBody);

// Also need to update the summary calculation at the bottom
content = content.replace(
  'Tổng cước VC: {products.reduce((s, p) => {\n                        const rate = Number(p.exchangeRate || 3520);\n                        return s + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);\n                      }, 0).toLocaleString(\'vi-VN\')} VND',
  'Tổng cước VC: {products.reduce((s, p) => {\n                        const rate = Number(p.exchangeRate || 3520);\n                        const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));
                        return s + Math.round(cny * rate);\n                      }, 0).toLocaleString(\'vi-VN\')} VND'
);

// Also update the per-currency calculation
content = content.replace(
  'const totalForeign = items.reduce((s, p) => s + (Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0), 0);',
  'const totalForeign = items.reduce((s, p) => s + (p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0))), 0);'
);

fs.writeFileSync(waybillPath, content, 'utf8');
console.log('WaybillNew.js updated successfully!');

// Now update PaymentRequestNew.js
const paymentPath = 'C:\\Users\\kamit\\Desktop\\procurement-SGI\\frontend\\src\\pages\\PaymentRequestNew.js';
const originalPayment = execSync('git show HEAD:frontend/src/pages/PaymentRequestNew.js', {
  cwd: 'C:\\Users\\kamit\\Desktop\\procurement-SGI',
  encoding: 'utf8'
});

let paymentContent = originalPayment;

// Add manualTotal to shipmentItems initialization
paymentContent = paymentContent.replace(
  'totalAmountVnd: item.totalAmountVnd || Math.round((item.totalAmountForeign || 0) * (Number(order.exchangeRate || 3520))),',
  'totalAmountVnd: item.totalAmountVnd || Math.round((item.totalAmountForeign || 0) * (Number(order.exchangeRate || 3520))),\n          manualTotal: undefined,'
);

// Replace Thành tiền display with editable input
// This is complex due to multiple tables. Let's try a more targeted approach
// Find the main product table body (shipmentItems.map)

fs.writeFileSync(paymentPath, paymentContent, 'utf8');
console.log('PaymentRequestNew.js updated (partial)!');
console.log('Done!');
