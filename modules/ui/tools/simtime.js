import { interpolateRgb as d3_interpolateRgb } from 'd3-interpolate';
import { timer as d3_timer } from 'd3-timer';

import { t } from '../../core/localizer';
import { svgIcon } from '../../svg';
import { fileFetcher } from '../../core/file_fetcher';
import { uiTooltip } from '../tooltip';
import { osmNote, osmNode, osmWay } from '../../osm';
import { geoSphericalDistance } from '../../geo';
import { actionAddEntity } from '../../actions/add_entity';
import { actionDeleteNode } from '../../actions/delete_node';
import { actionMoveNode } from '../../actions/move_node';
import { services } from '../../services';
import { uiPresetIcon } from '../preset_icon';
import { utilGetAllNodes } from '../../util/util'

export function uiToolSimTime(context) {

    var tool = {
        id: 'simtime',
        label: t('simtime.title')
    };

    var button = null;
    var tooltipBehavior = null;
    var _elapsedTime = 0;

    function isDisabled() {
        return false;
    }

    function updateTimer() {
        let _timer = d3_timer(function () {
            fileFetcher.getNoCache('simtime')
                .then(function (d) { _elapsedTime = d.time; }) //d['time']
                .catch(function () { /* ignore */ });
            context.simtime = _elapsedTime;
            if (_elapsedTime > 0) {
                //cause refresh
                context.layers().layer('markup').enabled(false);
                context.layers().layer('markup').enabled(true);
            } else if (_elapsedTime == 0) {
                context.layers().layer('markup').enabled(false);
            }

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
