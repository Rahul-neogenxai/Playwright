/*
 * Place an order directly via API using Playwright's browser context.
 * @param {object} page - Playwright page instance (already logged in and ready)
 * @param {object} params - { symbolToEnter, qty, priceOneDecimal, securityId, clientId, clientMemberCode, notsUniqueClientCode, hostSessionId }
 */
export async function placeOrderViaApi(page, {
  symbolToEnter,
  qty,
  priceOneDecimal,
  securityId,
  clientId,
  clientMemberCode,
  notsUniqueClientCode,
  hostSessionId
  
}) {
  try {
    // 1. Get cookies and XSRF token from the browser context
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const xsrfCookie = cookies.find(c => c.name === 'XSRF-TOKEN');
    const xsrfToken = xsrfCookie ? xsrfCookie.value : '';

    // Dynamically get host-session-id from cookies
    // const sessionIdCookie = cookies.find(c => c.name === 'host-session-id');
    // const hostSessionId = sessionIdCookie ? sessionIdCookie.value : '';

    // 2. Prepare headers
    const headers = {
      'accept': 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'cookie': cookieHeader,
      'x-xsrf-token': xsrfToken,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'origin': 'https://tms48.nepsetms.com.np',
      'referer': 'https://tms48.nepsetms.com.np/tms/me/memberclientorderentry',
      'host-session-id': hostSessionId,
      'membercode': '48', 
      'request-owner': '109298' 
    };

    // Print all headers being sent
    // console.log('Order API headers:');
    // Object.entries(headers).forEach(([key, value]) => {
    //   console.log(`${key}: ${value}`);
    // });

    // 3. Prepare order body
    const orderBody = {
      orderBook: {
        orderBookExtensions: [
          {
            orderTypes: { id: 1, orderTypeCode: "LMT" },
            disclosedQuantity: 0,
            orderValidity: { id: 1, orderValidityCode: "DAY" },
            triggerPrice: 0,
            orderPrice: parseFloat(priceOneDecimal),
            orderQuantity: parseInt(qty, 10),
            remainingOrderQuantity: parseInt(qty, 10),
            marketType: { id: 2, marketType: "Continuous" }
          }
        ],
        exchange: { id: 1 },
        dnaConnection: {},
        dealer: {},
        member: {},
        productType: { id: 1, productCode: "CNC" },
        instrumentType: { id: 1, code: "EQ" },
        client: {
          activeStatus: "A",
          id: clientId,
          accountType: "CLI",
          allowedToTrade: "Y",
          clientMemberCode: clientMemberCode,
          clientOrDealer: "C",
          contactNumber: "9861717917",
          notsUniqueClientCode: notsUniqueClientCode,
          clientDealerType: null,
          clientGroup: { activeStatus: "A", id: null, clientGroupCode: null, clientGroupName: null },
          memberBranch: { activeStatus: "A", id: 1, branchLocation: null, branchName: null, hidden: null, branchProvince: null, branchDistrict: null, branchMunicipality: null, branchHead: null, branchPhoneNumber: null },
          clientDealerAddressDetails: null,
          clientDealerBankDetail: null,
          clientDealerIndividual: null,
          clientDealerPerTradeLimits: null,
          clientDealerProductMappings: null,
          clientDealerOrderTypeMappings: null,
          clientDealerTradingLimits: null,
          clientDepositoryDetail: null,
          corporateDetail: null,
          corporateOwnershipDetails: null,
          displayName: "ANISH KHAYAMALI",
          blockedDate: null,
          remarks: null,
          parentId: null,
          recordType: null,
          collateralByEntities: null,
          shortSellMode: 0,
          onlineOrOffline: 1,
          panNumber: "116643450",
          onlineFundTransfer: null,
          collateralCalculationMode: 1,
          isMarginLendingClient: null,
          clientRiskType: null,
          userAgreementChecked: null,
          referredBy: null,
          responseStatus: null,
          isCkycAccount: null,
          kycUpload: false,
          marginLendingClient: null
        },
        security: {
          id: securityId,
          exchangeSecurityId: securityId,
          marketProtectionPercentage: 0,
          divisor: 100,
          boardLotQuantity: 1,
          tickSize: 0.1
        },
        accountType: 1,
        cpMemberId: 0,
        buyOrSell: 1 // 1 for buy, 2 for sell
      },
      orderPlacedBy: 2,
      exchangeOrderId: null
    };

    // Print the payload being sent
    // console.log('Order API payload:', JSON.stringify(orderBody, null, 2));

    // 4. Send the POST request using Playwright's page.request API
    const response = await page.request.post(
      'https://tms48.nepsetms.com.np/tmsapi/orderApi/order/',
      {
        headers,
        data: orderBody
      }
    );

    const rawText = await response.text();
    // console.log('Order API raw response:', rawText);

    let result;
    try {
      result = JSON.parse(rawText);
    } catch (err) {
      return { success: false, error: rawText };
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message || err };
  }
}