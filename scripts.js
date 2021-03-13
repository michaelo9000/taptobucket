
$(document).ready(function () {
    [42, 70, 85, 100]
        .forEach((value, i) => {
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
        $(this).data('down', null);
    });
}

taxChecked = () => {
    var checked = $('#pre-tax').prop('checked');
    var displayValue = checked ? '' : 'none';
    $('#tax').css('display', displayValue);
}

calc = () => {
    var shouldRemoveTax = $('#pre-tax').prop('checked');

    var payGross = $('#pay').val();
    var rentWeekly = $('#rent').val();
    var weeks = $('#weeks').val();

    var rent = rentWeekly * weeks;

    if (!payGross || !rent) {
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

    var tax = payGross * taxRate;
    var payExcl = payGross - tax;
    var payNet = payExcl - rent;

    var expenses = payNet * getAllocation(0) / 100;
    var extinguisher = payNet * getAllocation(1) / 100;
    var futureFunMoney = payNet * getAllocation(2) / 100;
    var funMoney = payNet * getAllocation(3) / 100;

    var output = `<div>
        <p>Total pay: $${Math.round(payGross * 100) / 100}</p>
        ${ taxRate > 0 ?
            `<p>Tax at ${taxRate * 100}%: $${Math.round(tax * 100) / 100}</p>` : ''
        }
        <hr />
        <p>Rent: $${Math.round(rent * 100) / 100}</p>
        <hr />
        <p>Expenses: $${Math.round(expenses * 100) / 100}</p>
        <p>Spending money: $${Math.round(funMoney * 100) / 100}</p>
        <p>Fire extinguisher: $${Math.round(extinguisher * 100) / 100}</p>
        <p>Goodies: $${Math.round(futureFunMoney * 100) / 100}</p>
    </div>`;

    $('#output').html(output);
}