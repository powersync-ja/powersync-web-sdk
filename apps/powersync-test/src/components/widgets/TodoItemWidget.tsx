import React from 'react';
import { ListItem, IconButton, ListItemAvatar, ListItemText, Box } from '@mui/material';

import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

export type TodoItemWidgetProps = {
  description: string;
  isComplete: boolean;
  onDelete: () => void;
  toggleCompletion: () => void;
};

export const TodoItemWidget: React.FC<TodoItemWidgetProps> = (props) => {
  return (
    <ListItem
      secondaryAction={
        <Box>
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={() => {
              props.onDelete();
            }}>
            <DeleteIcon />
          </IconButton>
        </Box>
      }>
      <ListItemAvatar>
        <IconButton
          edge="end"
          aria-label="toggle"
          onClick={() => {
            props.toggleCompletion();
          }}>
          {props.isComplete ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
        </IconButton>
      </ListItemAvatar>
      <ListItemText primary={props.description} />
    </ListItem>
  );
};
