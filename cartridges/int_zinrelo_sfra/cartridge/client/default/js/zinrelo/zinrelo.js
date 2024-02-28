'use strict';

var script;

/**
 * Initiates Zinrelo dashboard
 */
function initZinreloDashboard() {
    var authDataURL = script.getAttribute('auth-data-url');
    if (authDataURL) {
        $.ajax({
            url: authDataURL,
            method: 'GET',
            success: async function (response) {
                if (response.success && response.userAuthData) {
                    var {
                        partnerID, jwtToken, version, server
                    } = response.userAuthData;

                    // Initialize the dashbaord widget
                    window._zrl = window._zrl || [];
                    // eslint-disable-next-line no-undef
                    _zrl.push(['init', {
                        partner_id: partnerID,
                        jwt_token: jwtToken,
                        version: version,
                        server: server
                    }]);
                }
            },
            error: function () {}
        });
    }
}

/**
 * Handles for rewards operations
 * @param {Object} e current event
 */
function handleRewardAjax(e) {
    e.preventDefault();
    const url = $(this).attr('action');
    const method = $(this).attr('method');
    var data = $(this).serialize();

    // Add csrf token
    const $inCartRedemptionCsrfToken = $('.inCartRedemptionCsrfToken');
    data += '&' + $inCartRedemptionCsrfToken.attr('name') + '=' + $inCartRedemptionCsrfToken.val();

    if (!url) {
        return;
    }

    $.spinner().start();
    $.ajax({
        url: url,
        method: method,
        data: data,
        success: function (result) {
            $.spinner().stop();
            if (result.success) {
                // Refresh the in-cart redemption section
                $('body').trigger('renderInCartRedemptionSection');
                $('body').trigger('couponRedemtion', result.basketModel.basketModel);
            }
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Binds events to in-cart redemption section
 */
function bindEvents() {
    var $redeemRewardForm = $('.redeemRewardForm');
    var $cancleRewardForm = $('.cancleRewardForm');
    var $zinreloRewardsDropdown = $('.zinreloRewardsDropdown');
    var $redeemZinreloRewardBtn = $('.redeemZinreloRewardBtn');

    if (!$zinreloRewardsDropdown.val()) {
        $redeemZinreloRewardBtn.attr('disabled', true);
    }

    $zinreloRewardsDropdown.on('change', function () {
        if ($(this).val()) {
            $redeemZinreloRewardBtn.attr('disabled', false);
        } else {
            $redeemZinreloRewardBtn.attr('disabled', true);
        }
    });

    $redeemRewardForm.on('submit', handleRewardAjax);
    $cancleRewardForm.on('submit', handleRewardAjax);
}

/**
 * Renders in cart redemption section in checkout
 */
function renderInCartRedemptionSection() {
    $('body').on('renderInCartRedemptionSection', function () {
        var inCartRedemptionURL = $('.inCartRedemptionURL').val();
        var $inCartRedemptionContainer = $('.inCartRedemptionContainer');
        var $spinnerCard = $inCartRedemptionContainer.find('.inCartRedemptionCard');

        if ($inCartRedemptionContainer.length > 0 && inCartRedemptionURL) {
            $spinnerCard.spinner().start();
            $.ajax({
                url: inCartRedemptionURL,
                method: 'GET',
                success: function (result) {
                    $inCartRedemptionContainer.html(result);
                    bindEvents();
                    $spinnerCard.spinner().stop();
                },
                error: function () {
                    $spinnerCard.spinner().stop();
                }
            });
        }
    });

    // Initial render
    $('body').trigger('renderInCartRedemptionSection');
}

$('body').on('couponRedemtion', function (e, data) {
    $('.shipping-total-cost').empty().append(data.totals.totalShippingCost);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total-sum').empty().append(data.totals.grandTotal);
    $('.sub-total').empty().append(data.totals.subTotal);
    if (data.totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount-total').empty()
            .append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').removeClass('hide-shipping-discount');
        $('.shipping-discount-total').empty().append('- '
            + data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }
})


module.exports = function (currentScript) {
    script = currentScript;
    return {
        initZinreloDashboard: initZinreloDashboard,
        renderInCartRedemptionSection: renderInCartRedemptionSection
    };
};
