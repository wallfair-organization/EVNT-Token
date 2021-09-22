/* /scripts/utils/groupbyarray.js */

// @dev - group array by multiple keys - used to fold multiple lock requirements into
// the same token lock contract
export function groupByArray (dataArray, groupPropertyArray) {
  const groups = {};
  dataArray.forEach(item => {
    const group = JSON.stringify(groupPropertyArray(item));
    groups[group] = groups[group] || [];
    groups[group].push(item);
  });
  return Object.keys(groups).map(function (group) {
    return groups[group];
  });
}
