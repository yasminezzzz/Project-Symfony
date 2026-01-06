<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260104162656 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE student_group DROP FOREIGN KEY FK_E5F73D58CB944F1A');
        $this->addSql('ALTER TABLE student_group DROP FOREIGN KEY FK_E5F73D581E5D0459');
        $this->addSql('DROP INDEX IDX_E5F73D581E5D0459 ON student_group');
        $this->addSql('DROP INDEX IDX_E5F73D58CB944F1A ON student_group');
        $this->addSql('ALTER TABLE student_group ADD level VARCHAR(50) NOT NULL, ADD created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', DROP test_id, DROP student_id');
        $this->addSql('ALTER TABLE student_group_members DROP FOREIGN KEY student_group_members_ibfk_2');
        $this->addSql('DROP INDEX user_id ON student_group_members');
        $this->addSql('CREATE INDEX IDX_963C7E6DA76ED395 ON student_group_members (user_id)');
        $this->addSql('ALTER TABLE student_group_members ADD CONSTRAINT student_group_members_ibfk_2 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user DROP FOREIGN KEY FK_8D93D649FE54D947');
        $this->addSql('DROP INDEX IDX_8D93D649FE54D947 ON user');
        $this->addSql('ALTER TABLE user DROP group_id');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE student_group ADD test_id INT NOT NULL, ADD student_id INT NOT NULL, DROP level, DROP created_at');
        $this->addSql('ALTER TABLE student_group ADD CONSTRAINT FK_E5F73D58CB944F1A FOREIGN KEY (student_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE student_group ADD CONSTRAINT FK_E5F73D581E5D0459 FOREIGN KEY (test_id) REFERENCES test (id)');
        $this->addSql('CREATE INDEX IDX_E5F73D581E5D0459 ON student_group (test_id)');
        $this->addSql('CREATE INDEX IDX_E5F73D58CB944F1A ON student_group (student_id)');
        $this->addSql('ALTER TABLE student_group_members DROP FOREIGN KEY FK_963C7E6DA76ED395');
        $this->addSql('DROP INDEX idx_963c7e6da76ed395 ON student_group_members');
        $this->addSql('CREATE INDEX user_id ON student_group_members (user_id)');
        $this->addSql('ALTER TABLE student_group_members ADD CONSTRAINT FK_963C7E6DA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user ADD group_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE user ADD CONSTRAINT FK_8D93D649FE54D947 FOREIGN KEY (group_id) REFERENCES student_group (id)');
        $this->addSql('CREATE INDEX IDX_8D93D649FE54D947 ON user (group_id)');
    }
}
