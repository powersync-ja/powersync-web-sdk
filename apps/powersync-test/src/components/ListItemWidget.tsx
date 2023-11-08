import React from 'react';
import { ListItem, IconButton, ListItemAvatar, Avatar, ListItemText, Box } from '@mui/material';

import DeleteIcon from '@mui/icons-material/DeleteOutline';
import RightIcon from '@mui/icons-material/ArrowRightAlt';
import ListIcon from '@mui/icons-material/ListAltOutlined';

export type ListItemWidgetProps = {
  title: string;
  description: string;
  onDelete: () => void;
  onPress: () => void;
};

export const ListItemWidget: React.FC<ListItemWidgetProps> = (props) => {
  return (
    <ListItem
      secondaryAction={
        <Box>
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={(event) => {
              props.onDelete();
            }}>
            <DeleteIcon />
          </IconButton>
          <IconButton
            edge="end"
            aria-label="proceed"
            onClick={(event) => {
              props.onPress();
            }}>
            <RightIcon />
          </IconButton>
        </Box>
      }>
      <ListItemAvatar>
        <Avatar>
          <ListIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={props.title} secondary={props.description} />
    </ListItem>
  );
};
