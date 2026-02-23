import axios from 'axios';

// Accept cookieHeader and xsrfToken as parameters
export async function placeOrderViaApi(page, {
  symbolToEnter,
  qty,
  priceOneDecimal,
  securityId,
  exchangeSecurityId,
  clientId,
  clientMemberCode,
  notsUniqueClientCode,
  hostSessionId,
  cookieHeader,
  xsrfToken
}) {
  try {
    // Prepare headers using passed values
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
    // console.log('Request Headers:', headers);
    // console.log('Request Headers:', headers);
    // console.log('Cookie Header:', cookieHeader);
    // console.log('XSRF Token:', xsrfToken);
    // console.log('Hosted-Session-ID', hostSessionId);

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
          exchangeSecurityId: exchangeSecurityId,
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

    // Send the POST request using axios
    const response = await axios.post(
      'https://tms48.nepsetms.com.np/tmsapi/orderApi/order/',
      orderBody,
      { headers }
    );

    return response.data;
  } catch (err) {
    // Handle axios/network errors
    if (err.response) {
      return { success: false, error: `Request failed with status code ${err.response.status}` };
    }
    if (err.code === 'ECONNRESET') {
      return { success: false, error: 'socket hang up' };
    }
    return { success: false, error: err.message || err };
  }
}