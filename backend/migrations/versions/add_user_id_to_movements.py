"""add user_id to movements

Revision ID: add_user_id_001
Revises: e8de99727e8a
Create Date: 2026-02-21

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_user_id_001'
down_revision = 'e8de99727e8a'
branch_labels = None
depends_on = None


def upgrade():
    # Add user_id column to movements table
    op.add_column('movements', sa.Column('user_id', sa.String(), nullable=True))
    
    # Create index for faster queries by user
    op.create_index('ix_movements_user_id', 'movements', ['user_id'])
    
    # For existing movements without user_id, they will be null (legacy data)
    # New movements will require user_id via API validation


def downgrade():
    op.drop_index('ix_movements_user_id', 'movements')
    op.drop_column('movements', 'user_id')
