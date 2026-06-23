// Script to modify WaybillNew.js
const fs = require('fs');

const filePath = 'C:\\Users\\kamit\\Desktop\\procurement-SGI\\frontend\\src\\pages\\WaybillNew.js';

let content = fs.readFileSync(filePath, 'utf8');

// 1. Change table header order - move Tỷ giá and Tổng cước before KL/T.tích
const oldHeader = `<th style={{ width: 28 }}>#</th>
                      <th>PO</th>
                      <th style={{ minWidth: 120 }}>Sản phẩm</th>
                      <th>SL</th>
                      <th style={{ width: 70 }}>KL/T.tích</th>
                      <th style={{ width: 85 }}>Đơn giá VC</th>
                      <th style={{ width: 80 }}>Tỷ giá</th>
                      <th style={{ width: 90 }}>Tổng cước</th>
                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>
                      <th style={{ width: 100 }}>Số kiện</th>`;

const newHeader = `<th style={{ width: 28 }}>#</th>
                      <th>PO</th>
                      <th style={{ minWidth: 120 }}>Sản phẩm</th>
                      <th>SL</th>
                      <th style={{ width: 80 }}>Tỷ giá</th>
                      <th style={{ width: 85 }}>Đơn giá VC</th>
                      <th style={{ width: 90 }}>Tổng cước</th>
                      <th style={{ width: 70 }}>KL/T.tích</th>
                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>
                      <th style={{ width: 100 }}>Số kiện</th>`;

content = content.replace(oldHeader, newHeader);

// 2. Change table body - reorder columns and make Tổng cước editable
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

// Update computedFreightVnd to use manualTotalCny if available
const oldComputedFreightVnd = `  const computedFreightVnd = useMemo(() => {
    return products.reduce((sum, p) => {
      const rate = Number(p.exchangeRate || 3520);
      return sum + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);
    }, 0);
  }, [products]);`;

const newComputedFreightVnd = `  const computedFreightVnd = useMemo(() => {
    return products.reduce((sum, p) => {
      const rate = Number(p.exchangeRate || 3520);
      const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));
      return sum + Math.round(cny * rate);
    }, 0);
  }, [products]);`;

content = content.replace(oldComputedFreightVnd, newComputedFreightVnd);

// Update productsPayload to include manualTotalCny
const oldProductsPayload = `    const productsPayload = products.map(p => ({
      poId: p.poId,
      poCode: p.poCode,
      posCode: p.posCode,
      productName: p.productName,
      spec: p.spec,
      orderedQty: p.orderedQty,
      unitPrice: p.unitPrice,
      currency: p.currency,
      exchangeRate: p.exchangeRate,
      volume: p.volume || '',
      unitPriceVC: p.unitPriceVC || '',
      packageCount: p.packageCount || '',
      shippingMethod: p.shippingMethod || '',
      purchaseOrderItemId: p.purchaseOrderItemId || null,
    }));`;

const newProductsPayload = `    const productsPayload = products.map(p => ({
      poId: p.poId,
      poCode: p.poCode,
      posCode: p.posCode,
      productName: p.productName,
      spec: p.spec,
      orderedQty: p.orderedQty,
      unitPrice: p.unitPrice,
      currency: p.currency,
      exchangeRate: p.exchangeRate,
      volume: p.volume || '',
      unitPriceVC: p.unitPriceVC || '',
      manualTotalCny: p.manualTotalCny,
      packageCount: p.packageCount || '',
      shippingMethod: p.shippingMethod || '',
      purchaseOrderItemId: p.purchaseOrderItemId || null,
    }));`;

content = content.replace(oldProductsPayload, newProductsPayload);

// Update initial product mapping to include manualTotalCny
const oldFromPOItems = `      const mapped = fromPOItems.map((item, i) => ({
        _itemId: \`from-po-\${i}\`,
        poId: item.poId,
        poCode: item.poCode,
        posCode: item.posCode || '',
        productName: item.productName || '',
        spec: item.spec || '',
        orderedQty: String(item.orderedQty || ''),
        unitPrice: String(item.unitPrice || ''),
        currency: item.currency || 'CNY',
        exchangeRate: String(item.exchangeRate || '3520'),
        volume: item.volume || '',
        unitPriceVC: item.unitPriceVC || '',
        packageCount: item.packageCount || String(item.orderedQty || ''),
        shippingMethod: item.shippingMethod || '',
        purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,
      }));`;

const newFromPOItems = `      const mapped = fromPOItems.map((item, i) => ({
        _itemId: \`from-po-\${i}\`,
        poId: item.poId,
        poCode: item.poCode,
        posCode: item.posCode || '',
        productName: item.productName || '',
        spec: item.spec || '',
        orderedQty: String(item.orderedQty || ''),
        unitPrice: String(item.unitPrice || ''),
        currency: item.currency || 'CNY',
        exchangeRate: String(item.exchangeRate || '3520'),
        volume: item.volume || '',
        unitPriceVC: item.unitPriceVC || '',
        packageCount: item.packageCount || String(item.orderedQty || ''),
        shippingMethod: item.shippingMethod || '',
        purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,
        manualTotalCny: undefined,
      }));`;

content = content.replace(oldFromPOItems, newFromPOItems);

// Update addSelectedItems to include manualTotalCny
const oldAddSelected = `        newProducts.push({
          _itemId: id,
          purchaseOrderItemId: item.purchaseOrderItemId,
          poId: item.poId,
          poCode: item.poCode,
          posCode: item.posCode,
          productName: item.productName,
          spec: item.spec,
          orderedQty: item.orderedQty,
          unitPrice: item.unitPrice,
          currency: item.currency,
          exchangeRate: item.exchangeRate,
          volume: '',
          unitPriceVC: '',
          packageCount: item.orderedQty,
          shippingMethod: item.shippingMethod || '',
        });`;

const newAddSelected = `        newProducts.push({
          _itemId: id,
          purchaseOrderItemId: item.purchaseOrderItemId,
          poId: item.poId,
          poCode: item.poCode,
          posCode: item.posCode,
          productName: item.productName,
          spec: item.spec,
          orderedQty: item.orderedQty,
          unitPrice: item.unitPrice,
          currency: item.currency,
          exchangeRate: item.exchangeRate,
          volume: '',
          unitPriceVC: '',
          manualTotalCny: undefined,
          packageCount: item.orderedQty,
          shippingMethod: item.shippingMethod || '',
        });`;

content = content.replace(oldAddSelected, newAddSelected);

fs.writeFileSync(filePath, content, 'utf8');
console.log('WaybillNew.js updated successfully!');
