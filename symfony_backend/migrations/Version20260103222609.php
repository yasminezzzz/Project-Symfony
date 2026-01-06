<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260103222609 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE student_group (id INT AUTO_INCREMENT NOT NULL, subject_id INT NOT NULL, name VARCHAR(255) NOT NULL, min_score INT NOT NULL, max_score INT NOT NULL, INDEX IDX_E5F73D5823EDC87 (subject_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE student_group ADD CONSTRAINT FK_E5F73D5823EDC87 FOREIGN KEY (subject_id) REFERENCES subject (id)');
        $this->addSql('ALTER TABLE user ADD group_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE user ADD CONSTRAINT FK_8D93D649FE54D947 FOREIGN KEY (group_id) REFERENCES student_group (id)');
        $this->addSql('CREATE INDEX IDX_8D93D649FE54D947 ON user (group_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE user DROP FOREIGN KEY FK_8D93D649FE54D947');
        $this->addSql('ALTER TABLE student_group DROP FOREIGN KEY FK_E5F73D5823EDC87');
        $this->addSql('DROP TABLE student_group');
        $this->addSql('DROP INDEX IDX_8D93D649FE54D947 ON user');
        $this->addSql('ALTER TABLE user DROP group_id');
    }
}
