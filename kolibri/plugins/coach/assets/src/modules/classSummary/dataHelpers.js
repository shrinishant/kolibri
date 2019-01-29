import map from 'lodash/map';
import get from 'lodash/get';
import meanBy from 'lodash/meanBy';
import flatten from 'lodash/flatten';
import { STATUSES } from './constants';

// getters that return lookup functions
export default {
  getGroupNames(state) {
    return function(groupIds) {
      return groupIds.map(id => state.groupMap[id].name);
    };
  },
  getGroupNamesForLearner(state, getters) {
    return function(learnerId) {
      return getters.groups
        .filter(group => group.member_ids.includes(learnerId))
        .map(group => group.name);
    };
  },
  getLearnersForGroups(state) {
    return function(groupIds) {
      // an empty list is considered the whole class in the context of assignment
      if (!groupIds.length) {
        return map(state.learnerMap, 'id');
      }
      return flatten(map(groupIds, id => state.groupMap[id].member_ids));
    };
  },
  getContentStatusForLearner(state) {
    return function(contentId, learnerId) {
      return get(
        state.contentLearnerStatusMap,
        [contentId, learnerId, 'status'],
        STATUSES.notStarted
      );
    };
  },
  getContentStatusCounts(state, getters) {
    return function(contentId, learnerIds) {
      const tallies = {
        [STATUSES.started]: 0,
        [STATUSES.notStarted]: 0,
        [STATUSES.completed]: 0,
        [STATUSES.helpNeeded]: 0,
      };
      learnerIds.forEach(learnerId => {
        const status = getters.getContentStatusForLearner(contentId, learnerId);
        tallies[status] += 1;
      });
      return tallies;
    };
  },
  getExamStatusForLearner(state) {
    return function(examId, learnerId) {
      return get(state.examLearnerStatusMap, [examId, learnerId, 'status'], STATUSES.notStarted);
    };
  },
  getAvgTimeSpent(state, getters) {
    return function(contentId, learnerIds) {
      const statuses = [];
      learnerIds.forEach(learnerId => {
        const status = getters.getContentStatusForLearner(contentId, learnerId);
        if (status !== STATUSES.notStarted) {
          statuses.push(state.contentLearnerStatusMap[contentId][learnerId]);
        }
      });
      if (!statuses.length) {
        return undefined;
      }
      return meanBy(statuses, 'time_spent');
    };
  },
};