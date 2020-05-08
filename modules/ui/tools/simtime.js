import { interpolateRgb as d3_interpolateRgb } from 'd3-interpolate';
import { timer as d3_timer } from 'd3-timer';

import { t } from '../../core/localizer';
import { svgIcon } from '../../svg';
import { fileFetcher } from '../../core/file_fetcher';
import { uiTooltip } from '../tooltip';


export function uiToolSimTime(context) {

    var tool = {
        id: 'simtime',
        label: t('simtime.title')
    };

    var button = null;
    var tooltipBehavior = null;
    var _elapsedTime = -1;


    function bgColor() {
        return d3_interpolateRgb('#fff', '#ff8', '#ff8');
    }

    function isDisabled() {
        return false;
    }

    function updateTimer() {
        let _timer = d3_timer(function () {
            fileFetcher.getNoCache('simtime')
                .then(function (d) { _elapsedTime = d.time; }) //d['time']
                .catch(function () { /* ignore */ });

            if (tooltipBehavior) {
                tooltipBehavior
                    .title(t('simtime.help'));
            }

            if (button) {
                button
                    .classed('disabled', isDisabled());

                button.select('span.count')
                    .text(_elapsedTime + " seconds");
            }


            //_timer.stop();
            return true;
        }, 500);

    }


    tool.render = function(selection) {
        tooltipBehavior = uiTooltip()
            .placement('bottom')
            .title(t('simtime.help'))
            .scrollContainer(context.container().select('.top-toolbar'));

        button = selection
            .append('button')
            .attr('class', 'simtime disabled bar-button')
            .call(tooltipBehavior);

        button
            .call(svgIcon('#fas-tachometer-alt'));

        button
            .append('span')
            .attr('class', 'count')
            .attr('aria-hidden', 'true')
            .text('0');

        updateTimer();

    };

    return tool;
}
