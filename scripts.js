var cookieOptions = { expires: 999 };

$(document).ready(function () {
    let allocationArray = [
        Cookies.get(`grip-0-left`) || 42,
        Cookies.get(`grip-1-left`) || 70,
        Cookies.get(`grip-2-left`) || 85,
        100
    ];

    allocationArray.forEach((value, i) => {
        $(document).data(`grip-${i}-left`, value);
        $(`#grip-${i}`).css('left', `${value}%`);
    });

    setAllocationDisplay();
    setSliderBackground();

    $(document).data('slider-width', $('#slider').outerWidth());
    $(document).data('slider-offset', $('#slider').offset().left);

    $('.slider-grip').each(function (i, grip) {
        $(this).on('mousedown touchstart', (e) => pointerDown(e, $(this)));
    });

    $('#tax').val(Cookies.get("taxRate") || "");
    $('#rent').val(Cookies.get("rentWeekly") || "");
    $('#min-expenses').val(Cookies.get("minExpenses") || "");
    $('#min-extinguisher').val(Cookies.get("minExtinguisher") || "");
    $('#min-splurge').val(Cookies.get("minSplurge") || "");
    $('#min-smile').val(Cookies.get("minSmile") || "");

    $(document).on('mousemove touchmove', (e) => pointerMove(e));
    $(document).on('mouseup touchend', (e) => pointerUp(e));
});

pointerDown = (e, grip) => {
    e.preventDefault();

    var isTouch = e.touches;
    grip.data('down', isTouch ? e.touches[0].clientX : e.clientX);

    if (!isTouch)
        pointerMove(e);
}

pointerMove = (e) => {
    var isTouch = e.touches;
    var pointerX = isTouch ? e.touches[0].clientX : e.clientX;
    var pointerXInGripSpace = e.offsetX;

    $('.slider-grip').each(function (i, grip) {
        var isDown = $(this).data('down');
        if (isDown != null) {
            $(this).data('down', pointerX);
            var sliderOffset = $(document).data('slider-offset');
            var sliderWidth = $(document).data('slider-width');
            var leftPercent = ((pointerX
                //+ pointerXInGripSpace
                - sliderOffset) / sliderWidth) * 100;

            if (i != 0) {
                var previousGripLeftPercent = $(document).data(`grip-${i - 1}-left`);
            }
            else {
                var previousGripLeftPercent = 0;
            }
            if (leftPercent < previousGripLeftPercent)
                leftPercent = previousGripLeftPercent;

            if (i != 2) {
                var nextGripLeftPercent = $(document).data(`grip-${i + 1}-left`);
            }
            else {
                var nextGripLeftPercent = 100;
            }
            if (leftPercent > nextGripLeftPercent)
                leftPercent = nextGripLeftPercent;

            $(this).css('left', `${leftPercent}%`);
            $(document).data(`grip-${i}-left`, leftPercent);
        }
    });
    setSliderBackground();
    setAllocationDisplay();
}

setSliderBackground = () => {
    var background = `linear-gradient(
                90deg, 
                rgba(0, 48, 73, 1) ${$('#grip-0').css('left')}, 
                rgba(214, 40, 40, 1) ${$('#grip-0').css('left')}, 
                rgba(214, 40, 40, 1) ${$('#grip-1').css('left')}, 
                rgba(247, 127, 0, 1) ${$('#grip-1').css('left')}, 
                rgba(247, 127, 0, 1) ${$('#grip-2').css('left')}, 
                rgba(252, 191, 73, 1) ${$('#grip-2').css('left')}
            )`;

    $('#slider').css('background', background);
}

setAllocationDisplay = () => {
    $('#grip-0').children('.slider-grip-percent').html(`${getAllocation(0)}%`);
    $('#grip-1').children('.slider-grip-percent').html(`${getAllocation(1)}%`);
    $('#grip-2').children('.slider-grip-percent').html(`${getAllocation(2)}%`);
    $('#grip-3').children('.slider-grip-percent').html(`${getAllocation(3)}%`);
}

getAllocation = (gripId) => {
    return Math.round(
        (
            $(document).data(`grip-${gripId}-left`)
            -
            ($(document).data(`grip-${gripId - 1}-left`) || 0)
        )
        * 10)
        / 10;
}

pointerUp = (e) => {
    $('.slider-grip').each(function (i, grip) {
        let leftPercent = $(document).data(`grip-${i}-left`)
        Cookies.set(`grip-${i}-left`, leftPercent, cookieOptions);
        $(this).data('down', null);
    });
}

taxChecked = () => {
    var checked = $('#pre-tax').prop('checked');
    var displayValue = checked ? '' : 'none';
    $('#tax-input').css('display', displayValue);
}

minimumsChecked = () => {
    var checked = $('#minimums').prop('checked');
    var displayValue = checked ? '' : 'none';
    $('#minimums-form').css('display', displayValue);
}

calc = () => {

    var shouldRemoveTax = $('#pre-tax').prop('checked');

    var payGross = $('#pay').val();
    var rentWeekly = $('#rent').val();
    var weeks = $('#weeks').val();

    Cookies.set('rentWeekly', rentWeekly, cookieOptions);

    var rent = rentWeekly * weeks;

    if (!payGross) {
        $('#output').html('type something idiot');
        return;
    }

    var taxRate = $('#tax').val();
    // If a decimal tax rate was input, convert it to a percentage.
    if (taxRate * 1 < 1)
        taxRate *= 100;

    // Convert tax rate to a decimal.
    taxRate /= 100;

    if (!shouldRemoveTax)
        taxRate = 0;

    Cookies.set('taxRate', taxRate, cookieOptions);

    var tax = payGross * taxRate;
    var payExcl = payGross - tax;
    var payNet = payExcl - rent;

    var expensesAllocation = getAllocation(0);
    var extinguisherAllocation = getAllocation(1);
    var splurgeAllocation = getAllocation(2);
    var smileAllocation = getAllocation(3);

    var expenses = payNet * expensesAllocation / 100;
    var extinguisher = payNet * extinguisherAllocation / 100;
    var splurge = payNet * splurgeAllocation / 100;
    var smile = payNet * smileAllocation / 100;

    var includeMinimums = $('#minimums').prop('checked');

    // Holy shit this is lazy and convoluted.
    // TODO convert to object oriented so that e.g. Smile can be prioritised over Splurge when it has a minimum and Splurge doesn't.
    if (includeMinimums) {
        var minExpenses = $('#min-expenses').val();
        var minExtinguisher = $('#min-extinguisher').val();
        var minSplurge = $('#min-splurge').val();
        var minSmile = $('#min-smile').val();

        var totalAllocation = 100;

        if (expenses < minExpenses) {
            if (minExpenses > payNet)
                expenses = payNet;
            else
                expenses = minExpenses;
        }

        payNet -= expenses;
        totalAllocation -= expensesAllocation;

        extinguisher = payNet * extinguisherAllocation / totalAllocation;

        if (extinguisher < minExtinguisher) {
            if (minExtinguisher > payNet)
                extinguisher = payNet;
            else
                extinguisher = minExtinguisher;
        }

        totalAllocation -= extinguisherAllocation;
        payNet -= extinguisher;

        splurge = payNet * splurgeAllocation / totalAllocation;

        if (splurge < minSplurge) {
            if (minSplurge > payNet)
                splurge = payNet;
            else
                splurge = minSplurge;
        }

        totalAllocation -= splurgeAllocation;
        payNet -= splurge;

        smile = payNet;

        Cookies.set('minExpenses', minExpenses, cookieOptions);
        Cookies.set('minExtinguisher', minExtinguisher, cookieOptions);
        Cookies.set('minSplurge', minSplurge, cookieOptions);
        Cookies.set('minSmile', minSmile, cookieOptions);
    }

    var output = `<div>
        <p>Total pay: $${Math.round(payGross * 100) / 100}</p>
        ${taxRate > 0 ?
            `<p>Tax at ${taxRate * 100}%: $${Math.round(tax * 100) / 100}</p>` : ''
        }
        <hr />
        <p>Rent: $${Math.round(rent * 100) / 100}</p>
        <hr />
        <p>Expenses: $${Math.round(expenses * 100) / 100}</p>
        <p>Fire extinguisher: $${Math.round(extinguisher * 100) / 100}</p>
        <p>Splurge: $${Math.round(splurge * 100) / 100}</p>
        <p>Smile: $${Math.round(smile * 100) / 100}</p>
    </div>`;

    $('#output').html(output);
}