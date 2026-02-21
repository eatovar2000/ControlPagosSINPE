"""FASE 7: add status and responsible to movements

Revision ID: fase7_001
Revises: add_user_id_001
Create Date: 2026-02-21

Safe migration: checks if columns exist before adding.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = 'fase7_001'
down_revision = 'add_user_id_001'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in the table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    # Add status column if not exists (default: 'pending')
    if not column_exists('movements', 'status'):
        op.add_column('movements', sa.Column('status', sa.String(), nullable=True, server_default='pending'))
        # Update existing rows to have 'pending' status
        op.execute("UPDATE movements SET status = 'pending' WHERE status IS NULL")
    
    # Add responsible column if not exists (optional text field)
    if not column_exists('movements', 'responsible'):
        op.add_column('movements', sa.Column('responsible', sa.String(), nullable=True))
    
    # Create index on status for faster filtering
    bind = op.get_bind()
    inspector = inspect(bind)
    indexes = [idx['name'] for idx in inspector.get_indexes('movements')]
    if 'ix_movements_status' not in indexes:
        op.create_index('ix_movements_status', 'movements', ['status'])


def downgrade():
    # Drop index if exists
    bind = op.get_bind()
    inspector = inspect(bind)
    indexes = [idx['name'] for idx in inspector.get_indexes('movements')]
    if 'ix_movements_status' in indexes:
        op.drop_index('ix_movements_status', 'movements')
    
    # Drop columns if exist
    if column_exists('movements', 'status'):
        op.drop_column('movements', 'status')
    if column_exists('movements', 'responsible'):
        op.drop_column('movements', 'responsible')
