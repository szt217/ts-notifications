import React from 'react';
import { View, Text } from './Themed';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

// helper functions
export const getPrettyTimestamp = (timestamp: number) => {
  const djs = dayjs(timestamp);
  if (djs.isToday()) return 'Today';
  else if (djs.isYesterday()) return 'Yesterday';
  else return djs.fromNow();
};

export const NotificationHeader: React.FC<{ timestamp: number }> = ({ timestamp }) => {
  return (
    <View style={{ paddingVertical: 6, paddingLeft: 12 }}>
      <Text style={{ fontWeight: '600', fontSize: 12 }}>{getPrettyTimestamp(timestamp)}</Text>
    </View>
  );
};
